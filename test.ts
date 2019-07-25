import {
   OPCUAClient,
   MessageSecurityMode, SecurityPolicy,
   AttributeIds,
   makeBrowsePath,
   ClientSubscription,
   TimestampsToReturn,
   MonitoringParametersOptions,
   ReadValueIdLike,
   ClientMonitoredItem,
   DataValue
} from "node-opcua";

const connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1
}

const options = {
    applicationName: "MyClient",
    connectionStrategy: connectionStrategy,
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    endpoint_must_exist: false,
};
const client = OPCUAClient.create(options);
const endpointUrl = "opc.tcp://10.131.1.35:62552/iCOpcUaServer";

async function main() {
    try {
        // step 1 : connect to
        connect();
        //await client.connect(endpointUrl);
        //console.log("connected !");
    
        // step 2 : createSession
        //var session = create_session();
        const session = await client.createSession();
        console.log("session created !");
    
        // step 3 : browse
        //browse();
        const browseResult = await session.browse("RootFolder");
    
        console.log("references of RootFolder :");
        for(const reference of browseResult.references) {
            console.log( "   -> ", reference.browseName.toString());
        }
    
        // step 4 : read a variable with readVariableValue
        //readValue();
        const dataValue2 = await session.readVariableValue("ns=2;s=Local.iCIR.Probe1.SpectraRaw");
        console.log(" value = " , dataValue2.toString());
    
        // step 4' : read a variable with read
        //read();
        const maxAge = 0;
        const nodeToRead = {
          nodeId: "ns=2;s=Local.iCIR.Probe1.SpectraRaw",
          attributeId: AttributeIds.Value
        };
        const dataValue =  await session.read(nodeToRead, maxAge);
        console.log(" value " , dataValue.toString());
    
        // step 5: install a subscription and install a monitored item for 10 seconds
        //subscription();
        const subscription = ClientSubscription.create(session, {
            requestedPublishingInterval: 1000,
            requestedLifetimeCount:      100,
            requestedMaxKeepAliveCount:   10,
            maxNotificationsPerPublish:  100,
            publishingEnabled: true,
            priority: 10
        });
    
        subscription.on("started", function() {
            console.log("subscription started for 2 seconds - subscriptionId=", subscription.subscriptionId);
        }).on("keepalive", function() {
            console.log("keepalive");
        }).on("terminated", function() {
           console.log("terminated");
        });
    
    
        // install monitored item
    
        const itemToMonitor: ReadValueIdLike = {
            nodeId: "ns=2;s=Local.iCIR.Probe1.SpectraRaw",
            attributeId: AttributeIds.Value
        };
        const parameters: MonitoringParametersOptions = {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 10
        };
    
        const monitoredItem  = ClientMonitoredItem.create(
            subscription,
            itemToMonitor,
            parameters,
            TimestampsToReturn.Both
        );
    
        monitoredItem.on("changed", (dataValue: DataValue) => {
           console.log(" value has changed : ", dataValue.value.toString());
        });
    
        //async function timeout(ms: number) {
        const timeout = async function(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await timeout(10000);
    
        console.log("now terminating subscription");
        await subscription.terminate();
    
        // step 6: finding the nodeId of a node by Browse name
        //browseName();
        const browsePath = makeBrowsePath("RootFolder", "/Objects/Server.ServerStatus.BuildInfo.ProductName");

        const result = await session.translateBrowsePath(browsePath);
        const productNameNodeId = result.targets[0].targetId;
        console.log(" Product Name nodeId = ", productNameNodeId.toString());
    
        // close session
        //close()
        await session.close();
    
        // disconnecting
        //disconnect();
        await client.disconnect();
        console.log("done !");
    } 
    catch(err) {
        console.log("An error has occured : ",err);
    }
}
main();

async function connect() {
    await client.connect(endpointUrl);
    console.log("connected !");
};

/*
function disconnect() {
    await client.disconnect();
    console.log("done !");
};

function create_session() {
    const session = await client.createSession();
    console.log("session created !");
};

function close() {
    await session.close();
};

function browse() {
    const browseResult = await session.browse("RootFolder");

    console.log("references of RootFolder :");
    for(const reference of browseResult.references) {
        console.log( "   -> ", reference.browseName.toString());
    }
}

function read() {
    const maxAge = 0;
    const nodeToRead = {
      nodeId: "ns=3;s=Scalar_Simulation_String",
      attributeId: AttributeIds.Value
    };
    const dataValue =  await session.read(nodeToRead, maxAge);
    console.log(" value " , dataValue.toString());
}

function readValue() {
    const dataValue2 = await session.readVariableValue("ns=2;s=Local.iCIR.Probe1.Trends.RTD1");
    console.log(" value = " , dataValue2.toString());
}

function browseName() {
    const browsePath = makeBrowsePath("RootFolder", "/Objects/Server.ServerStatus.BuildInfo.ProductName");

    const result = await session.translateBrowsePath(browsePath);
    const productNameNodeId = result.targets[0].targetId;
    console.log(" Product Name nodeId = ", productNameNodeId.toString());
}

function subscription() {
    const subscription = ClientSubscription.create(session, {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount:      100,
        requestedMaxKeepAliveCount:   10,
        maxNotificationsPerPublish:  100,
        publishingEnabled: true,
        priority: 10
    });

    subscription.on("started", function() {
        console.log("subscription started for 2 seconds - subscriptionId=", subscription.subscriptionId);
    }).on("keepalive", function() {
        console.log("keepalive");
    }).on("terminated", function() {
       console.log("terminated");
    });


    // install monitored item

    const itemToMonitor: ReadValueIdLike = {
        nodeId: "ns=3;s=Scalar_Simulation_Float",
        attributeId: AttributeIds.Value
    };
    const parameters: MonitoringParametersOptions = {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 10
    };

    const monitoredItem  = ClientMonitoredItem.create(
        subscription,
        itemToMonitor,
        parameters,
        TimestampsToReturn.Both
    );

    monitoredItem.on("changed", (dataValue: DataValue) => {
       console.log(" value has changed : ", dataValue.value.toString());
    });



    async function timeout(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    await timeout(10000);

    console.log("now terminating subscription");
    await subscription.terminate();
    }    
*/
