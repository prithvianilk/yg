import json
import os
import shutil
from dotenv import load_dotenv

dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)

def create_terraform_files(cluster_name,desired_size,instance_type,node_group_name):
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID', default=None)
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY', default=None)
    path=create_temp_folder(cluster_name)
    with open(f"{os.getcwd()}/terraform/terraform.tfvars.json","r") as template_file:
        template_file_data=json.load(template_file)
    template_file_data["cluster_name"]=cluster_name
    template_file_data["desired_size"]=desired_size
    template_file_data["instance_type"]=instance_type
    template_file_data["node_group_name"]=node_group_name
    with open(f'{path}/terraform.tfvars.json', 'w') as fp:
        json.dump(template_file_data, fp)
    backend_data=open(f'{path}/backend.tf','w')
    backend_text='''terraform{{
    backend "s3"{{
        region="ap-south-1"
        bucket="yg-hack-s3"
        key="{}-terraformstate/terraform.tfstate"
        access_key = "{}"
        secret_key = "{}"
    }}
}}'''.format(cluster_name, aws_access_key_id, aws_secret_access_key)
    backend_data.write(backend_text)
    create_cluster(path)


def create_temp_folder(cluster_name):
    if not os.path.exists(os.path.join(os.getcwd(),"temp_tf",cluster_name)):
        os.mkdir(os.path.join(os.getcwd(),"temp_tf",cluster_name))
    shutil.copyfile(os.path.join(os.getcwd(),"terraform/main.tf"),os.path.join(os.getcwd(),"temp_tf",cluster_name,"main.tf"))
    shutil.copyfile(os.path.join(os.getcwd(),"terraform/output.tf"),os.path.join(os.getcwd(),"temp_tf",cluster_name,"output.tf"))
    shutil.copyfile(os.path.join(os.getcwd(),"terraform/provider.tf"),os.path.join(os.getcwd(),"temp_tf",cluster_name,"provider.tf"))
    shutil.copyfile(os.path.join(os.getcwd(),"terraform/variable.tf"),os.path.join(os.getcwd(),"temp_tf",cluster_name,"variable.tf"))
    return os.path.join(os.getcwd(),"temp_tf",cluster_name)

def create_cluster(path):
    os.system(f"terraform -chdir={path} init")

def check_cluster_change(data):
    for cluster in data:
        if not os.path.exists(os.path.join(os.getcwd(),"temp_tf",cluster['name'])):
            create_terraform_files(cluster['name'],cluster['numberOfHosts'],"t2.small","node-group-1")
        