"use client";
import React, { useState } from "react";
import { Form } from "react-bootstrap";
import TrackingNumberList from "./TrackingNumberList";
import { TNCreate } from "@/utils/pocketbase";
import { RecordModel } from "pocketbase";

interface DeliveryFormProps {
  trackingNumbers: RecordModel[];
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ trackingNumbers }) => {
  const [enteredTrackingNumber, setEnteredTrackingNumber] = useState("");
  const [trackingNumberList, setTrackingNumberList] = useState<RecordModel[]>([]);

  const updateTrackingNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      trackingNumbers.some(
        (obj) => obj.TrackingNumber === enteredTrackingNumber
      ) ||
      enteredTrackingNumber === "" ||
      trackingNumberList.some(
        (obj) => obj.TrackingNumber === enteredTrackingNumber
      )
    ) {
      setEnteredTrackingNumber("");
      return;
    }
    const timestamp = new Date();
    const aliasid = localStorage.getItem("id");
    const createRecord = {
      TrackingNumber: enteredTrackingNumber,
      Delivered: timestamp,
      alias: aliasid as string,
    };
    const record = await TNCreate(createRecord);
    setTrackingNumberList([...trackingNumberList, record]);
    setEnteredTrackingNumber("");
  };

  return (
    <>
      <Form onSubmit={updateTrackingNumber} className="text-center">
        <Form.Label className="text-white">Tracking Number</Form.Label>
        <Form.Control
          type="trackingNumber"
          placeholder="Enter Tracking Number"
          value={enteredTrackingNumber}
          onChange={(e) => setEnteredTrackingNumber(e.target.value)}
        />
      </Form>
      <TrackingNumberList trackingNumbersList={trackingNumberList} />
    </>
  );
};

export default DeliveryForm;