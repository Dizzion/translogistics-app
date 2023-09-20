import DeliveryForm from "@/components/DeliveryForm";
import { TNGetAll } from "@/utils/pocketbase";
import { RecordModel } from "pocketbase";
import React from "react";


async function Delivery() {
  const trackingNumbers = await TNGetAll() as RecordModel;

  return (
    <div style={{ backgroundColor: "#5d5f63" }}>
      <DeliveryForm
        trackingNumbers={trackingNumbers.items}
      />
    </div>
  );
}

export default Delivery;
