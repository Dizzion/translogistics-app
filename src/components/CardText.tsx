import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";

interface TextProps {
  variant: string;
  timestamp: string | undefined;
  sap?: boolean;
}

export const CardText: React.FC<TextProps> = ({ variant, timestamp, sap }) => {
  const [content, setContent] = useState<React.JSX.Element>(
    <Card.Footer></Card.Footer>
  );

  useEffect(() => {
    if (variant === "success") {
      setContent(<Card.Text>Scanned at {timestamp}</Card.Text>);
    } else if (variant === "secondary") {
      setContent(<Card.Text>Arrived at SEA133</Card.Text>);
    } else if (variant === "info") {
      setContent(<Card.Text>Awaiting Scan</Card.Text>);
    } else if (sap === true) {
        setContent(<Card.Text>SAP Package</Card.Text>);
    } else {
        setContent(<Card.Text>Awaiting Previous Action</Card.Text>);
    }
  }, [variant, timestamp]);
  return <>{content}</>;
};
