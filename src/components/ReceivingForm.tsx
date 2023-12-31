"use client";
import { RecordModel } from "pocketbase";
import React, { useRef, useState } from "react";
import { Form, Row, Col, Button, Modal } from "react-bootstrap";
import HandlingUnitList from "./HandlingUnitList";
import {
  HUCreate,
  TNGetByTN,
  TNUpdate,
  addEmployees,
  getEmployeeByFullName,
  updateEmployees,
} from "@/utils/pocketbase";
import QRCode from "qrcode";
import Image from "next/image";

export interface Requestor {
  name: string;
  building: string;
  inventory: string;
  freight: string;
  jira: string;
  handlingUnits: string[];
  coupaPoLines: string;
}

const ReceivingForm: React.FC = () => {
  const modalRef = useRef(null);
  const [modalPrint, setModalPrint] = useState(false);
  const [mysteryModal, setMysteryModal] = useState(false);
  const [addEmployee, setAddEmployee] = useState(false);
  const [generateFullName, setGenerateFullName] = useState(true);
  const [updateEmployee, setUpdateEmployee] = useState(false);
  const [enteredEmployee, setEnteredEmployee] = useState({
    employee_id: "",
    alias: "",
    first_name: "",
    last_name: "",
    Full_Name: "",
    job_title: "",
    manager_alias: "",
    department_name: "",
    office_building: "",
    default_delivery_location: "",
    default_location: "",
  });
  const [enteredTrackingNumber, setEnteredTrackingNumber] = useState("");
  const [printLabel, setPrintLabel] = useState({
    trackingNumber: "",
    timestamp: "",
    requestorName: "",
    buildingLocation: "",
    jira: "",
    freight: "",
    sap: "",
    qrCodeDataUrl: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [showAlert2, setShowAlert2] = useState(false);
  const [showAlert3, setShowAlert3] = useState(false);
  const [showAlert4, setShowAlert4] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [enteredHUs, setEnteredHUs] = useState<number[]>([]);
  const [enteredHU, setEnteredHU] = useState("");
  const [pulledEmployee, setPulledEmployee] = useState<RecordModel>();
  const [requestor, setRequestor] = useState<Requestor>({
    name: "",
    building: "",
    inventory: "",
    freight: "",
    jira: "",
    handlingUnits: [],
    coupaPoLines: "",
  });

  async function pullRequestorBuilding(e: string) {
    setRequestor({ ...requestor, name: e, building: "" });
    const requestorName = e;
    const employee = await getEmployeeByFullName(requestorName);
    if (employee.items[0] !== undefined) {
      setPulledEmployee(employee.items[0]);
      setRequestor({
        ...requestor,
        name: requestorName,
        building: employee.items[0].default_location,
      });
    }
  }

  const handlePrint = async () => {
    const modalCurrent = modalRef.current as HTMLElement | null;
    if (modalCurrent) {
      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(
          "<html><head><title>Print</title></head><body>"
        );

        printWindow.document.write(
          '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
        );

        printWindow.document.write("<style>");
        printWindow.document.write(
          "div { justify-content: center; text-align: center; }"
        );
        printWindow.document.write("</style>");

        printWindow.document.write(
          '<link rel="stylesheet" type="text/css" href="C:/Users/gofro/Documents/NextJSProjects/kuiper-translogistics/src/app/globals.css">'
        );

        printWindow.document.write(
          '<script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>'
        );
        printWindow.document.write(
          '<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>'
        );
        printWindow.document.write(
          '<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>'
        );

        printWindow.document.write(
          '<div style="width: 4in; height: 6in; padding: 10px; border: 1px solid #000;">'
        );

        printWindow.document.write(modalCurrent.innerHTML);

        printWindow.document.write("</div>");

        printWindow.document.write("</body></html>");

        printWindow.document.close();
      }
    }
  };

  const updateHandlingUnitList = async (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date();
    if (enteredHUs.includes(Number(enteredHU))) {
      setEnteredHU("");
      return;
    } else if (
      !/^(199|133|299|233)/.test(enteredHU) ||
      isNaN(Number(enteredHU))
    ) {
      setShowAlert(true);
      return;
    }
    const HU = {
      HU: Number(enteredHU),
      ToQI: timestamp,
      alias: localStorage.getItem("id") as string,
    };
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
    const newTimestamp = new Date();

    const searchedTN = await TNGetByTN(enteredTrackingNumber);

    if (searchedTN.items.length > 0) {
      if (searchedTN.items[0].Inbound133.length === 0 && searchedTN.items[0].Delivered.length === 0) {
        setShowAlert2(true);
        return;
      }
      const updatedTrackingNumber = {
        TrackingNumber: enteredTrackingNumber,
        Received133: newTimestamp,
        full_name: requestor.name,
        default_location: requestor.building,
        CoupaPOLines: requestor.coupaPoLines,
        SAP: requestor.inventory,
        Freight: requestor.freight,
        Jira: requestor.jira,
        HU: requestor.handlingUnits,
        aliasRec133: localStorage.getItem("id") as string,
      };
      setPrintLabel({
        trackingNumber: enteredTrackingNumber,
        timestamp: newTimestamp.toLocaleString(),
        requestorName: requestor.name,
        buildingLocation: requestor.building,
        jira: requestor.jira,
        sap: requestor.inventory,
        freight: requestor.freight,
        qrCodeDataUrl: await QRCode.toDataURL(enteredTrackingNumber),
      });
      await TNUpdate(searchedTN.items[0].id, updatedTrackingNumber);
      setModalPrint(true);
    } else {
      setShowAlert2(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requestor.building === "") {
      setShowAlert3(true);
      return;
    }
    if (
      requestor.name !== "" &&
      (requestor.inventory === "Yes" || requestor.inventory === "No") &&
      (requestor.freight === "Yes" || requestor.freight === "No")
    ) {
      await updateAsReceived(enteredTrackingNumber, requestor);
      setShowAlert4(true);
      return;
    }
    setShowAlert3(true);
  }

  const setFullName = () => {
    setEnteredEmployee({
      ...enteredEmployee,
      Full_Name: `${enteredEmployee.first_name} ${enteredEmployee.last_name}`,
    });
    setGenerateFullName(false);
    setShowSubmit(true);
  };

  function keepInfo(): void {
    setShowAlert4(false);
    setEnteredHUs([]);
    setEnteredTrackingNumber("");
  }

  function clearForm(): void {
    setShowAlert4(false);
    setEnteredHUs([]);
    setEnteredTrackingNumber("");
    setRequestor({
      name: "",
      building: "",
      inventory: requestor.inventory,
      freight: requestor.freight,
      jira: "",
      handlingUnits: [],
      coupaPoLines: "",
    });
  }

  function handleClose(): void {
    setShowAlert(false);
    setShowAlert2(false);
    setShowAlert3(false);
    setMysteryModal(false);
    setAddEmployee(false);
    setUpdateEmployee(false);
    setEnteredHU("");
    setEnteredEmployee({
      employee_id: "",
      alias: "",
      first_name: "",
      last_name: "",
      Full_Name: "",
      job_title: "",
      manager_alias: "",
      department_name: "",
      office_building: "",
      default_delivery_location: "",
      default_location: "",
    });
  }

  async function addEnteredEmployee(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await addEmployees(enteredEmployee);
    setAddEmployee(false);
    setGenerateFullName(true);
    setShowSubmit(false);
    setEnteredEmployee({
      employee_id: "",
      alias: "",
      first_name: "",
      last_name: "",
      Full_Name: "",
      job_title: "",
      manager_alias: "",
      department_name: "",
      office_building: "",
      default_delivery_location: "",
      default_location: "",
    });
  }

  function showUpdateEmployee(): void {
    if (pulledEmployee) {
      setEnteredEmployee({
        employee_id: pulledEmployee.employee_id,
        alias: pulledEmployee.alias,
        first_name: pulledEmployee.first_name,
        last_name: pulledEmployee.last_name,
        Full_Name: pulledEmployee.Full_Name,
        job_title: pulledEmployee.job_title,
        manager_alias: pulledEmployee.manager_alias,
        department_name: pulledEmployee.department_name,
        office_building: pulledEmployee.office_building,
        default_delivery_location: pulledEmployee.default_delivery_location,
        default_location: pulledEmployee.default_location,
      });
    }
    setUpdateEmployee(true);
  }

  async function updateEnteredEmployee(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFullName();
    if (pulledEmployee) {
      await updateEmployees(pulledEmployee.id, enteredEmployee);
    }
    setUpdateEmployee(false);
    setEnteredEmployee({
      employee_id: "",
      alias: "",
      first_name: "",
      last_name: "",
      Full_Name: "",
      job_title: "",
      manager_alias: "",
      department_name: "",
      office_building: "",
      default_delivery_location: "",
      default_location: "",
    });
  }

  const changedEnteredTrackingNumber = (e: string) => {
    setEnteredTrackingNumber(e);
    if (e === "Mystery" || e === "mystery") {
      setMysteryModal(true);
    }
  }

  async function enteredMystery(e: React.FormEvent) {
    e.preventDefault();
    const timestamp = new Date();
    const inputs = e.target as HTMLFormElement;
    setPrintLabel({
      ...printLabel,
      timestamp: timestamp.toLocaleString(),
      requestorName: inputs.fullName.value,
      trackingNumber: inputs.trackingNumber.value,
      jira: "Mystery",
      qrCodeDataUrl: await QRCode.toDataURL(inputs.trackingNumber.value),
    });
    setMysteryModal(false);
    setModalPrint(true);
    setEnteredHUs([]);
    setEnteredTrackingNumber("");
    setRequestor({
      name: "",
      building: "",
      inventory: requestor.inventory,
      freight: requestor.freight,
      jira: "",
      handlingUnits: [],
      coupaPoLines: "",
    });
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
            onChange={(e) => changedEnteredTrackingNumber(e.target.value)}
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
            <Col className="text-center" style={{ marginTop: "1.5rem" }}>
              {requestor.building === "" ? (
                <Button
                  variant="outline-light"
                  type="button"
                  onClick={() => setAddEmployee(true)}
                >
                  Add Employee
                </Button>
              ) : (
                <Button
                  variant="outline-warning"
                  type="button"
                  onClick={() => showUpdateEmployee()}
                >
                  Update Employee
                </Button>
              )}
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
                    inventory: e.target.value,
                  })
                }
              >
                <option>Dropdown Options</option>
                <option value={"No"}>Non-Inventory</option>
                <option value={"Yes"}>SAP Inventory</option>
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
                    freight: e.target.value,
                  })
                }
              >
                <option>Dropdown Options</option>
                <option value={"Yes"}>Yes</option>
                <option value={"No"}>No</option>
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
        <Button
          style={{ marginTop: "5px", marginBottom: "15px" }}
          type="submit"
          variant="outline-light"
        >
          Receive Package
        </Button>
      </Form>
      <Form onSubmit={updateHandlingUnitList}>
        <Form.Control
          type="Handling Unit"
          required
          placeholder="Scan Handling Unit Here!"
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
      <Modal centered show={showAlert4}>
        <Modal.Body>
          Would you like to reset the form or keep the information?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={keepInfo}>
            Keep Info
          </Button>
          <Button variant="secondary" onClick={clearForm}>
            Clear
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal centered show={showAlert2} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Missing Previous Scan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Pervious Scan hasn't been captured please make sure to follow the
          entire process.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal centered show={mysteryModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Mystery Label Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            onSubmit={enteredMystery}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // Prevent form submission on Enter key press
              }
            }}
          >
            <Form.Control
              id="trackingNumber"
              name="trackingNumber"
              placeholder="Tracking Number Here"
              />
            <Form.Control
              id="fullName"
              name="fullName"
              placeholder="Full Employee Name"
            />
            <Button type="submit">Create Label</Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal centered show={showAlert3} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Missing Employee Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Employee entered doesn't exist in the Database make sure your are
          capitalizing the first letter of both first and last name and/or add
          the new employee to the database.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal className="printable-content" show={modalPrint} centered>
        <Modal.Dialog ref={modalRef}>
          <Modal.Header>Received Date: {printLabel.timestamp}</Modal.Header>
          <Modal.Body className="justify-content-center">
            <h3>Requestor:</h3>
            <h2>{printLabel.requestorName}</h2>
            <p>{printLabel.buildingLocation}</p>
            <h5>Jira:</h5>
            <p>{printLabel.jira}</p>
            <Row>
              <Col>
                <h6>Freight:</h6>
                {printLabel.freight}
              </Col>
              <Col>
                <h6>SAP:</h6>
                {printLabel.sap}
              </Col>
            </Row>
            <h3>Tracking Number:</h3>
            <p>{printLabel.trackingNumber}</p>
            <Image
              src={printLabel.qrCodeDataUrl}
              alt="QR Code"
              width="150"
              height="150"
            />
          </Modal.Body>
        </Modal.Dialog>
        <Modal.Footer>
          <Button type="button" onClick={() => handlePrint()}>
            Print Label
          </Button>
          <Button type="button" onClick={() => setModalPrint(false)}>
            Close Label
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal centered show={addEmployee} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={addEnteredEmployee}>
            <Row>
              <Col>
                <Form.Control
                  type="first_name"
                  size="sm"
                  required
                  placeholder="First Name"
                  value={enteredEmployee.first_name}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      first_name: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="last_name"
                  size="sm"
                  required
                  placeholder="Last Name"
                  value={enteredEmployee.last_name}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      last_name: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              {generateFullName === true ? (
                <Button type="button" variant="secondary" onClick={setFullName}>
                  Click Here to set Full Name
                </Button>
              ) : (
                <Form.Control
                  type="Full_Name"
                  size="sm"
                  required
                  disabled
                  value={enteredEmployee.Full_Name}
                />
              )}
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="employee_id"
                  size="sm"
                  placeholder="Employee ID"
                  value={enteredEmployee.employee_id}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      employee_id: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="alias"
                  size="sm"
                  placeholder="alias"
                  required
                  value={enteredEmployee.alias}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      alias: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="job_title"
                  size="sm"
                  placeholder="Job Title"
                  value={enteredEmployee.job_title}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      job_title: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="manager_alias"
                  size="sm"
                  placeholder="Manager Alias"
                  value={enteredEmployee.manager_alias}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      manager_alias: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="department_name"
                  size="sm"
                  placeholder="Department Name"
                  value={enteredEmployee.department_name}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      department_name: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="office_building"
                  size="sm"
                  placeholder="Office Building"
                  value={enteredEmployee.office_building}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      office_building: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="default_delivery_location"
                  size="sm"
                  placeholder="Default Delivery Location"
                  value={enteredEmployee.default_delivery_location}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      default_delivery_location: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="default_location"
                  size="sm"
                  placeholder="Default Location"
                  required
                  value={enteredEmployee.default_location}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      default_location: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            {showSubmit ? (
              <Button variant="secondary" type="submit">
                Submit
              </Button>
            ) : (
              <></>
            )}
          </Form>
        </Modal.Body>
      </Modal>
      <Modal centered show={updateEmployee} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Update Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={updateEnteredEmployee}>
            <Row>
              <Col>
                <Form.Control
                  type="first_name"
                  size="sm"
                  required
                  disabled
                  placeholder="First Name"
                  value={enteredEmployee.first_name}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      first_name: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="last_name"
                  size="sm"
                  required
                  disabled
                  placeholder="Last Name"
                  value={enteredEmployee.last_name}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      last_name: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="employee_id"
                  size="sm"
                  placeholder="Employee ID"
                  value={enteredEmployee.employee_id}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      employee_id: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="alias"
                  size="sm"
                  placeholder="alias"
                  required
                  value={enteredEmployee.alias}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      alias: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="job_title"
                  size="sm"
                  placeholder="Job Title"
                  value={enteredEmployee.job_title}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      job_title: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="manager_alias"
                  size="sm"
                  placeholder="Manager Alias"
                  value={enteredEmployee.manager_alias}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      manager_alias: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="department_name"
                  size="sm"
                  placeholder="Department Name"
                  value={enteredEmployee.department_name}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      department_name: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="office_building"
                  size="sm"
                  placeholder="Office Building"
                  value={enteredEmployee.office_building}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      office_building: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Control
                  type="default_delivery_location"
                  size="sm"
                  placeholder="Default Delivery Location"
                  value={enteredEmployee.default_delivery_location}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      default_delivery_location: e.target.value,
                    })
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="default_location"
                  size="sm"
                  placeholder="Default Location"
                  value={enteredEmployee.default_location}
                  onChange={(e) =>
                    setEnteredEmployee({
                      ...enteredEmployee,
                      default_location: e.target.value,
                    })
                  }
                />
              </Col>
            </Row>
            <Button variant="secondary" type="submit">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ReceivingForm;
