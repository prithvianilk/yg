import { type NextPage } from "next";
import Head from "next/head";
import { useRef } from "react";
import Sidebar from "~/components/Sidebar";

import { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  Controls,
  Node,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useStore,
} from "reactflow";

const initialNodes: Node[] = [];
let id = 0;
const Home: NextPage = () => {
  const reactFlowWrapper = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [rightPane, setRightPane] = useState(false);
  const [selectedNode, setSelectedNode] = useState({id:"", data:{resourceType:""}});

  const getNodeById = (id: string) => {
    return nodes.find((node) => node.id === id)?.data;
  };

  const getId = () => {
    ++id;
    return "flow-node-" + String(id);
  };

  const submit = () => {
    const clusters: any = {};
    edges.forEach(({ source: clusterId, target: appId }) => {
      const node = getNodeById(clusterId);
      const numberOfHosts = node.numberOfHosts;
      const clusterName = node.label;
      if (!clusters[clusterId]) {
        clusters[clusterId] = { name: clusterName, numberOfHosts, apps: [] };
      }
      const app = getNodeById(appId)?.label as string;
      if (!clusters[clusterId].apps[app]) {
        clusters[clusterId].apps[app] = 0;
      }
      clusters[clusterId].apps[app]++;
    });

    const body = Object.keys(clusters).map((cluster) => {
      const { name, numberOfHosts, apps } = clusters[cluster];
      return {
        name,
        numberOfHosts,
        apps: Object.keys(apps).map((appName) => ({
          appName,
          replicas: apps[appName],
        })),
      };
    });

    console.log(body);
  };

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      // @ts-ignore
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const label = event.dataTransfer.getData("label");
      const type = event.dataTransfer.getData("type");
      const resourceType = event.dataTransfer.getData("resourceType");

      // @ts-ignore
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label, resourceType },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onNodeClick = async (e: any, node: any) => {
    if (!rightPane) {
      setRightPane(true);
    }
    await setSelectedNode(node);
    console.log(node);
  };

  const onNodeDelete = async () => {
    setNodes((ns) => {
      return ns.filter((node) => {
        return node.id != selectedNode.id;
      });
    });
    setRightPane(false);
    setEdges(
      edges.filter((edge) => {
        return !(
          edge.source == selectedNode.id || edge.target == selectedNode.id
        );
      })
    );
  };

  return (
    <>
      <Head>
        <title>yg</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <ReactFlowProvider>
          <div className="reactflow-wrapper" ref={reactFlowWrapper}></div>
          <div style={{ height: "100vh" }} className="flex">
            <div className="h-screen w-1/5 bg-gray-100">
              <Sidebar submit={submit} />
            </div>
            <div className={"h-screen" + rightPane ? "w-4/5" : "w-3/5"}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                // @ts-ignore
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                fitView
              >
                <Controls />
              </ReactFlow>
            </div>
            {rightPane ? (
              <div className="min-h-full w-1/5 bg-gray-100">
                <button
                  className="btn-square btn absolute top-0 right-0 m-1"
                  onClick={() => {
                    setRightPane(false);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="bg-green">
                  {selectedNode.data.resourceType == "cloud" ? (
                    <div className="flex flex-col justify-center">
                      <label>Cloud Service Provider</label>
                      <div className="form-control">
                        <div className="input-group">
                          <select className="select-bordered select">
                            <option disabled selected>
                              Select
                            </option>
                            <option>AWS</option>
                            <option>GCP</option>
                            <option>Azure</option>
                          </select>
                          <button className="btn">Go</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>AAA</>
                  )}
                </div>
                <div className="align-center flex min-h-full flex-row justify-center">
                  <div className="absolute bottom-0 m-4">
                    <button
                      className="jus btn-outline btn-error btn"
                      onClick={onNodeDelete}
                    >
                      Remove Resource
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </ReactFlowProvider>
      </main>
    </>
  );
};

export default Home;
