import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import {removeClassStringFromData, removeClassStringFromDataSimple} from '../App'

class Shipment_JobBooked extends Component {
  constructor(props) {
    super(props);

    this.state = {
        columnDefs: [
            {headerName: "ID", field: "shipment_JobID", checkboxSelection: true},
            {headerName: "Job Status", field: "jobStatus"},
            {headerName: "Voyages", field: "quoteComputedBestVoyages", cellStyle: {'white-space': 'pre-line'}, autoHeight: true, valueFormatter: removeClassStringFromData},
            {headerName: "Initial Port", field: "initialPort", valueFormatter: removeClassStringFromData},
            {headerName: "Final Port", field: "finalPort", valueFormatter: removeClassStringFromData},
            {headerName: "Depart Date", field: "CustomerPreferedDepartureDate"},
            {headerName: "Arrive Date", field: "CustomerPreferedArrivalDate"},
            //{headerName: "CustomerSuppliedContainer", field: "isCustomerSuppliedContainer"},
            {headerName: "Customer", field: "Customer"},
            //{headerName: "Haulage Type", field: "originHaulageType"},
            {headerName: "Container", field: "Container", valueFormatter: removeClassStringFromData},
            {headerName: "Paid", field: "recievedPayment"}

        ],
        rowData: [],
        modal: false,
        getRowHeight: function(params) {
          // assuming 50 characters per line, working how how many lines we need
          return 100;
            // return 18 * (Math.floor(params.data.name.length / 45) + 1);
      }
    };

    this.toggle = this.toggle.bind(this);
    this.bookJob = this.bookJob.bind(this);
  }
  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  bookJob() {
    debugger;
    fetch('/api/Shipment_Job_Book_Voyage', {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        {
          $class: 'org.example.shipping.Shipment_Job_Book_Voyage',
          containerVoyage_NextID: Date.now().toString(),
          shipment_Job: 'resource:org.example.shipping.Shipment_Job#' + this.state.modal_shipment_JobID
        })
    }).then(function(response) {
        if (!response.ok) {
          throw Error(response.status + ' ' + response.statusText);
        }
        return response;})
      .then(res => res.json())
      .then(res => alert("Transaction Succsesfull \n"))
      .catch((error) => {console.log('error: ' + error);
        alert('error: ' + error);
        this.setState({ requestFailed: true });
    });

    this.setState({
      modal: !this.state.modal
    });

    fetch('/api/Shipment_Job')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    .catch(error => alert('Error fetching Jobs: ' + error));
  }

onGridReady(params) {
  this.gridApi = params.api;
  this.gridColumnApi = params.columnApi;

  window.onresize = () => {
    this.gridApi.sizeColumnsToFit();
  }

//Get Data
    fetch('/api/Shipment_Job?filter={"where": {"or":[{"jobStatus": "VoyageAndContainerBooked"},{"jobStatus": "JobInProgress"},{"jobStatus": "JobComplete"}]}}')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    .catch(error => alert('Error fetching Jobs: ' + error));
}

onFirstDataRendered(params) {
  params.api.sizeColumnsToFit();
}

render() {
    return (
      <div style={{ width: "100%", height: "100%", minheight: "100px" }}>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Booked, In-Progress or Completed Jobs</h1>
          <div className="btn-toolbar mb-2 mb-md-0">
            <div className="btn-group mr-2">
              <button className="btn btn-sm btn-outline-secondary">Print</button>
              <button className="btn btn-sm btn-outline-secondary">Export</button>
            </div>
          </div>
        </div>
            <div 
              className="ag-theme-balham"
              style={{ 
                width: "100%", 
                height: "500px" }} 
            >
            
                <AgGridReact
                    // onGridReady={ params => this.gridApi = params.api }
                    onGridReady={this.onGridReady.bind(this)}
                    onFirstDataRendered={this.onFirstDataRendered.bind(this)}
                    
                    enableColResize={true}
                    enableSorting={true}
                    enableFilter={true}
                    columnDefs={this.state.columnDefs}
                    rowData={this.state.rowData}>
                </AgGridReact>
            </div>
            <p>Jobs listed here are Fully Booked with container, In-Progress or Completed<br/></p>        

        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          <ModalHeader toggle={this.toggle}>Book Job onto Voyages</ModalHeader>
          <ModalBody>
            <pre>
              <b>Job ID: </b>{this.state.modal_shipment_JobID}
              <br/>
              <b>Voyages: </b>
              <br/>
              {this.state.modal_Voyages}
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.bookJob}>Confirm</Button>{' '}
            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
          </ModalFooter>
        </Modal>

      </div>  
    );
  }

  onButtonClick = e => {
    debugger;
    const selectedNodes = this.gridApi.getSelectedNodes()  
    if (selectedNodes.length > 0){
      const selectedData = selectedNodes.map( node => node.data )
      const selectedDataStringPresentation = selectedData.map( node => node.shipment_JobID + ' ' + node.quoteComputedBestVoyages).join(', ')
     // alert(`Selected nodes: ${selectedDataStringPresentation}`)
      this.setState({modal_shipment_JobID: selectedData[0].shipment_JobID.toString(), modal_Voyages: selectedData[0].quoteComputedBestVoyages.join('\n')});
      this.toggle();
    }else{
      alert('Please Select a Job');
    }
      
  }
}

export default Shipment_JobBooked;
