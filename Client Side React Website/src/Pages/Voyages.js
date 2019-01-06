import React, {Component} from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';

class Voyages extends Component {
  constructor(props) {
    super(props);

    this.state = {
        columnDefs: [
            {headerName: "ID", field: "voyageID", checkboxSelection: true},
            {headerName: "Ship", field: "ship", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Capacity", field: "TotalCapacity_TEU", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Booked", field: "BookedCapacity_TEU"},
            {headerName: "Route", field: "route", valueFormatter: removeClassStringFromDataSimple},

            {headerName: "Origin", field: "originPort", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Dest", field: "destinationPort", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "VoyageStatus", field: "voyageStatus"},
            {headerName: "PreviousVoyage", field: "previousVoyage", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "NextVoyage", field: "nextVoyage", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "OriginArrival", field: "originArrivalTime_UTC", sort: "asc"},
            {headerName: "DestArrival", field: "destinationArrivalTime_UTC"}

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



    fetch('/api/Voyage')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    // .catch(error => this.setStatethis.setState([{make: "Please Log In", model: "", price: 0}]));
}

    // componentDidMount() {
    //   }

onFirstDataRendered(params) {
  params.api.sizeColumnsToFit();
}

render() {
    return (
      <div style={{ width: "100%", height: "100%", minheight: "100px" }}>
      
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Ship Voyages</h1>
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
            </div>
        );
  }

  onButtonClick = e => {
    const selectedNodes = this.gridApi.getSelectedNodes()  
    const selectedData = selectedNodes.map( node => node.data )
    const selectedDataStringPresentation = selectedData.map( node => node.make + ' ' + node.model).join(', ')
    alert(`Selected nodes: ${selectedDataStringPresentation}`) 
  }
}

function removeClassStringFromData(params) {
  return params.value.toString().replace(/resource:org.example.shipping./g, '').replace(/,/g, ',\n');
}
function removeClassStringFromDataSimple(params) {
  if (params.value){
    return params.value.toString().replace('resource:org.example.shipping.', '');
  }else{
    return '';
  }
}

export default Voyages;
