import jinja2

def create_deployment_from_template(template_file, provider, cluster_name, image_name):
	templateLoader = jinja2.FileSystemLoader(searchpath="../k8s")
	templateEnv = jinja2.Environment(loader=templateLoader)
	template = templateEnv.get_template(template_file)

	output_text = template.render({"image_name": image_name})  # this is where to put args to the template renderer
	# to save the results
	with open(f"../temp/{provider}-{cluster_name}/{template_file}-{image_name}.yaml", "w") as f:
		f.write(output_text)