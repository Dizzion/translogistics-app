"use client";
import { RecordModel } from "pocketbase";
import React, { useState } from "react";
import { Form, Row, Col, Button, Modal } from "react-bootstrap";
import HandlingUnitList from "./HanldingUnitList";
import { HUCreate, TNCreate, TNUpdate } from "@/utils/pocketbase";

interface ReceivingFormProps {
  employees: RecordModel[];
  trackingNumbers: RecordModel[];
}
export interface Requestor {
  name: string;
  building: string;
  inventory: boolean;
  freight: boolean;
  jira: string;
  handlingUnits: string[];
  coupaPoLines: string;
}

const ReceivingForm: React.FC<ReceivingFormProps> = ({
  employees,
  trackingNumbers,
}) => {
  const [enteredTrackingNumber, setEnteredTrackingNumber] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [enteredHUs, setEnteredHUs] = useState<number[]>([]);
  const [enteredHU, setEnteredHU] = useState("");
  const [requestor, setRequestor] = useState<Requestor>({
    name: "",
    building: "",
    inventory: false,
    freight: false,
    jira: "",
    handlingUnits: [],
    coupaPoLines: "",
  });

  function pullRequestorBuilding(e: string) {
    if (e === "") {
      setRequestor({ ...requestor, name: e , building: ''});
    }
    const requestorName = e;
    const requestorIndex = employees.findIndex(
      (employee) => employee.Full_Name === requestorName
    );
    if (requestorIndex !== -1) {
      setRequestor({
        ...requestor,
        name: requestorName,
        building: employees[requestorIndex].default_location,
      });
    } else {
      setRequestor({ ...requestor, name: e , building: ''});
    }
  }

  const updateHandlingUnitList = async (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date();
    if (enteredHUs.includes(Number(enteredHU))) {
      setEnteredHU("");
      return;
    } else if (!/^(199|133|299|233)/.test(enteredHU)) {
      setShowAlert(true);
      return;
    }
    const HU = {
      HU: Number(enteredHU),
      ToQI: timestamp,
      alias: localStorage.getItem("id") as string
    }
    const createdHU = await HUCreate(HU);
    setEnteredHUs([...enteredHUs, createdHU.HU]);
    setRequestor({
      ...requestor,
      handlingUnits: [...requestor.handlingUnits, createdHU.id],
    });
    setEnteredHU("");
  };

  async function updateAsReceived(
    enteredTrackingNumber: string,
    requestor: Requestor
  ) {
    const newTimestamp = new Date().toLocaleString();

    const existingTrackingNumberIndex = trackingNumbers.findIndex(
      (trackingNumber) =>
        trackingNumber.TrackingNumber === enteredTrackingNumber
    );
    if (
      existingTrackingNumberIndex !== -1 &&
      typeof requestor.inventory === "boolean" &&
      typeof requestor.freight === "boolean"
    ) {
      const updatedTrackingNumber = {
        TrackingNumber: enteredTrackingNumber,
        Outbound99: trackingNumbers[existingTrackingNumberIndex].Outbound99,
        Inbound133: trackingNumbers[existingTrackingNumberIndex].Inbound133,
        Received133: newTimestamp,
        Outbound133: trackingNumbers[existingTrackingNumberIndex].Outbound133,
        Inbound99: trackingNumbers[existingTrackingNumberIndex].Inbound99,
        full_name: requestor.name,
        default_location: requestor.building,
        CoupaPOLines: requestor.coupaPoLines,
        SAP: requestor.inventory,
        Freight: requestor.freight,
        Jira: requestor.jira,
        HU: requestor.handlingUnits,
        alias: localStorage.getItem("id") as string,
      };
      await TNUpdate(
        trackingNumbers[existingTrackingNumberIndex].id,
        updatedTrackingNumber
      );
    } else {
      const newTrackingNumber = {
        TrackingNumber: enteredTrackingNumber,
        Outbound99: "",
        Inbound133: "",
        Received133: newTimestamp,
        Outbound133: "",
        Inbound99: "",
        full_name: requestor.name,
        default_location: requestor.building,
        CoupaPOLines: requestor.coupaPoLines,
        SAP: requestor.inventory,
        Freight: requestor.freight,
        Jira: requestor.jira,
        HU: requestor.handlingUnits,
        alias: localStorage.getItem("id") as string,
      };
      await TNCreate(newTrackingNumber);
    }
    setEnteredHUs([]);
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requestor.name !== "") {
      updateAsReceived(enteredTrackingNumber, requestor);
      setEnteredTrackingNumber("");
      setRequestor({
        name: "",
        building: "",
        inventory: false,
        freight: false,
        jira: "",
        handlingUnits: [],
        coupaPoLines: "",
      });
    }
  }
  function handleClose(): void {
    setShowAlert(false);
    setEnteredHU("");
  }
  return (
    <>
      <Form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Prevent form submission on Enter key press
          }
        }}
      >
        <Form.Group>
          <Form.Label className="text-white">Tracking Number</Form.Label>
          <Form.Control
            type="trackingNumber"
            size="lg"
            placeholder="Tracking Number Here"
            required
            value={enteredTrackingNumber}
            onChange={(e) => setEnteredTrackingNumber(e.target.value)}
          />
          <Row>
            <Col>
              <Form.Label className="text-white">Requestors Name</Form.Label>
              <Form.Control
                type="name"
                size="sm"
                placeholder="Full Name"
                required
                value={requestor.name}
                onChange={(e) => pullRequestorBuilding(e.target.value)}
              />
            </Col>
            <Col>
              <Form.Label className="text-white">
                Requestors Location
              </Form.Label>
              <Form.Control
                type="location"
                size="sm"
                placeholder="Auto-Generates from Name"
                disabled
                value={requestor.building}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Label className="text-white">
                Inventory or Non-Inventory
              </Form.Label>
              <Form.Select
                size="sm"
                required
                onChange={(e) =>
                  setRequestor({
                    ...requestor,
                    inventory: Boolean(e.target.value),
                  })
                }
              >
                <option>Dropdown Options</option>
                <option value={'false'}>Non-Inventory</option>
                <option value={'true'}>SAP Inventory</option>
              </Form.Select>
            </Col>
            <Col>
              <Form.Label className="text-white">Freight?</Form.Label>
              <Form.Select
                size="sm"
                required
                onChange={(e) =>
                  setRequestor({
                    ...requestor,
                    freight: Boolean(e.target.value),
                  })
                }
              >
                <option>Dropdown Options</option>
                <option value={'true'}>Yes</option>
                <option value={'false'}>No</option>
              </Form.Select>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Label className="text-white">Jira</Form.Label>
              <Form.Control
                type="jira"
                size="sm"
                placeholder="PUR-XXXX"
                value={requestor.jira}
                onChange={(e) =>
                  setRequestor({ ...requestor, jira: e.target.value })
                }
              />
            </Col>
            <Col>
              <Form.Label className="text-white">CoupaPO & Lines</Form.Label>
              <Form.Control
                type="coupaPoLines"
                size="sm"
                placeholder="B901-XXXXXXXX(Lines X,X-X,X)"
                required
                value={requestor.coupaPoLines}
                onChange={(e) =>
                  setRequestor({ ...requestor, coupaPoLines: e.target.value })
                }
              />
            </Col>
          </Row>
        </Form.Group>
        <Button type="submit" variant="outline-light">
          Receive Package
        </Button>
      </Form>
      <Form onSubmit={updateHandlingUnitList}>
        <Form.Label className="text-white">Handling Unit</Form.Label>
        <Form.Control
          type="Handling Unit"
          required
          placeholder="199XXXXXXX, 299XXXXXXX, 133XXXXXXX, 233XXXXXXX"
          value={enteredHU}
          onChange={(e) => setEnteredHU(e.target.value)}
        />
      </Form>
      <HandlingUnitList handlingUnits={enteredHUs} />
      <Modal centered show={showAlert} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Handling Unit Invalid</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          The Handling Unit you scanned is not valid make sure you scanning the
          correct barcode.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ReceivingForm;