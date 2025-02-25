import { useEffect, useState, useRef } from "react";
import * as SignalR from "@microsoft/signalr";
import NetInfo from "@react-native-community/netinfo";

const getHubConnection = (userData: any, userToken: any, socketUrl: any) => {
  const apiUrl = socketUrl;
  const [connection, setConnection] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const isConnecting = useRef(false);
  const hasConnectionId = useRef(false);

  useEffect(() => {
    if (isConnecting.current || !userData || hasConnectionId.current) {
      return;
    }
    const createConnection = async () => {
      isConnecting.current = true;
      const newConnection: any = new SignalR.HubConnectionBuilder()
        .withUrl(`${socketUrl}`, {
          skipNegotiation: true,
          transport: SignalR.HttpTransportType.WebSockets,
          accessTokenFactory: () => {
            return userToken;
          },
        })
        .configureLogging(SignalR.LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      const getConnectionId = async (conn) => {
        console.log("Fetching connection ID...");

        try {
          const newConnectionId = await conn.invoke(
            "GetConnectionId",
            userData?.userId
          );
          console.log(
            "Fetched connectionId:getHubConnection ",
            newConnectionId
          );
          setConnectionId(newConnectionId);
          hasConnectionId.current = true;
        } catch (e) {
          console.log("Error getting connection ID: ", e);
        }
      };

      newConnection.onclose(() => {
        setIsConnected(false);
        hasConnectionId.current = false;
      });

      try {
        await newConnection.start();
        await getConnectionId(newConnection);
        setConnection(newConnection);
        setIsConnected(true);
        console.log("SignalR Connected");
      } catch (e) {
        console.log("SignalR Connection Error: ", e);
      } finally {
        isConnecting.current = false;
      }
    };

    const setupConnection = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected && !connectionId && !hasConnectionId.current) {
        await createConnection();
      }

      const unsubscribe = NetInfo.addEventListener((state: any) => {
        setIsConnected(state.isConnected);
        if (
          state.isConnected &&
          !connection &&
          !connectionId &&
          !hasConnectionId.current
        ) {
          createConnection();
        }
      });

      return () => {
        if (connection) {
          connection.stop();
        }
        unsubscribe();
      };
    };
    setupConnection();
  }, [userData]);

  return { connection, isConnected, connectionId };
};

export default getHubConnection;
