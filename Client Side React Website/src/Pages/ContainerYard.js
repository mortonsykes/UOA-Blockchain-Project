import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import {removeClassStringFromData, removeClassStringFromDataSimple} from '../App'

class ContainerYard extends Component {
  constructor(props) {
    super(props);

    this.state = {
        columnDefs: [
            {headerName: "ID", field: "containerYardLocationID", checkboxSelection: true},
            {headerName: "Available Containers", field: "idleContainers"},
            {headerName: "Organisation", field: "organisation", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Address", field: "Address"},
            {headerName: "Closist Port", field: "closistPort", valueFormatter: removeClassStringFromDataSimple},
            //{headerName: "Is Shared Yard", field: "currentJob", valueFormatter: removeClassStringFromDataSimple}

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
    fetch('/api/ContainerYardLocation')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    .catch(error => this.setStatethis.setState([{make: "Please Log In", model: "", price: 0}]));
}

onFirstDataRendered(params) {
  params.api.sizeColumnsToFit();
}

render() {
    return (
      <div style={{ width: "100%", height: "100%", minheight: "100px" }}>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Container Yards</h1>
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
                height: "600px" }} 
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

function removeClassStringFromYardDataSimple(params) {
  if (params.value){
    return params.value.toString().replace('resource:org.example.shipping.ContainerYardLocation', '');
  }else{
    return '';
  }
}

export default ContainerYard;
