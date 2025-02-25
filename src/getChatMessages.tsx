import { useEffect, useState } from "react";

const getChatMessages = (connection, connectionId, userData) => {
  console.log(
    "connection, connectionId, userDat",
    connection,
    connectionId,
    userData
  );

  const [messages, setMessages] = useState([
    {
      jsonData:
        "Hi " +
        `${
          userData?.basicInformation?.userName
            ? userData?.basicInformation?.userName
            : ""
        }` +
        ", I am here to listen. Tell me what's going on?",
      sender: "AI",
    },
  ]);
  const [loader, setLoader] = useState(true);
  const [connectionData, setConnectionData] = useState(null);
  const [isLoadingAIResponse, setIsLoadingAIResponse] = useState(false); // New loading state for AI response

  useEffect(() => {
    setMessages([
      {
        jsonData:
          "Hi " +
          `${
            userData?.basicInformation?.userName
              ? userData?.basicInformation?.userName
              : ""
          }` +
          ", I am here to listen. Tell me what's going on?",
        sender: "AI",
      },
    ]);
    if (connection) {
      connection.on("ReceiveMessage", (message: any) => {
        let data;
        try {
          data = JSON.parse(message);
        } catch (error) {
          console.error(error);
          return;
        }

        if (data && data["Success"]) {
          data = data.Data.Message.replace(/^(?:```json|```)$/g, "").trim();

          console.log("current get msg", data);
          const msg = {
            sender: "AI",
            jsonData: data,
          };
          setMessages((prevMessages) => [...prevMessages, msg]);
          setIsLoadingAIResponse(false); // Stop loading when AI response is received
        }
        setLoader(false);
      });

      const getChatData = async () => {
        setLoader(true);
        const payload = {
          ConnectionId: connectionId,
          UserId: userData?.userId,
          CategoryName: "Chat",
          sender: "User",
          PageSize: 45,
          PageNumber: 1,
          IsGreeting: true,
        };
        console.log("history payload", payload);

        try {
          connection.invoke("GetUserAIChatHistory", payload);
          connection.on("GetUserAIChatHistory", (res: any) => {
            console.log("history resp", res);
            setConnectionData(res);
            setMessages(res?.data?.messageData.reverse());
            setLoader(false);
          });
        } catch (err) {
          console.error(err);
        }
      };

      getChatData();
    }
  }, [connection, connectionId]);
  console.log("onnection, connectionId", connection, connectionId);

  const sendMessage = async (messageText: any) => {
    if (connection && connectionId) {
      const payload = {
        ConnectedId: connectionId,
        UserId: userData?.userId,
        CategoryName: "Chat",
        jsonData: messageText,
        sender: "User",
        ConversationId: connectionData ? connectionData.data.conversationId : 0,
      };
      const msg = {
        sender: "User",
        jsonData: messageText,
      };
      try {
        await connection.send("SendMessage", payload);
        if (messageText) setMessages((prevMessages) => [...prevMessages, msg]);
        setIsLoadingAIResponse(true); // Start loading AI response
      } catch (err) {}
    }
  };

  return { messages, sendMessage, loader, isLoadingAIResponse }; // Return the new state
};

export default getChatMessages;
