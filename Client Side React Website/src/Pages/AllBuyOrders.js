import React, {Component} from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class AllBuyOrders extends Component {
  constructor(props) {
    super(props);

    this.state = {
        columnDefs: [
            {headerName: "ID", field: "slotTokenBuyOrderID", checkboxSelection: true},
            {headerName: "Voyage", field: "voyage.voyageID"},
            {headerName: "Quantity", field: "containerSlotQuantity_TEU"},
            {headerName: "Max Buy Price", field: "buyPriceLimit", valueFormatter: AddCurrencySymbol},
            {headerName: "Buyer", field: "buyer.organisationID", valueFormatter: removeClassStringFromDataSimple},

            {headerName: "Route", field: "voyage.route.routeID", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Origin", field: "voyage.originPort.portID", valueFormatter: removeClassStringFromDataSimple},            
            {headerName: "Destination", field: "voyage.destinationPort.portID", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Ship Sail Date", field: "voyage.originArrivalTime_UTC", type: 'dateColumn'},

            {headerName: "Created Date", field: "created", type: 'dateColumn'},
            {headerName: "Last Modified", field: "lastModified", type: 'dateColumn'},
            {headerName: "Status", field: "status"},
            {headerName: "Voyage", field: "buyerToken.voyageSlot_TokenID", hide: true},

            //{headerName: "Owner", field: "Owner", valueFormatter: removeClassStringFromDataSimple},
            //cellStyle: {'white-space': 'pre-line'}, autoHeight: true,
        ],
        rowData: [],
        getRowHeight: function(params) {
          return 100;    
      }
    }
  }


onGridReady(params) {
  this.gridApi = params.api;
  this.gridColumnApi = params.columnApi;

  window.onresize = () => {
    this.gridApi.sizeColumnsToFit();
  }

//Get Data
    fetch('/api/SlotTokenBuyOrder?filter={"where": {"status": "Pending"},"include":"resolve"}')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    .catch(error => alert('Error fetching Orders: ' + error));
}

onFirstDataRendered(params) {
  params.api.sizeColumnsToFit();
}

render() {
    return (
      <div style={{ width: "100%", height: "100%", minheight: "100px" }}>

      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">All Buy Orders</h1>
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
            <p>
              <br/>
            </p>

      </div>  
    );
  }

}

function removeClassStringFromDataSimple(params) {
  if (params.value){
    return params.value.toString().replace('resource:org.example.shipping.', '');
  }else{
    return '';
  }
}

function AddCurrencySymbol(params) {
  return '$'+ params.value.toString();
}

export default AllBuyOrders;
