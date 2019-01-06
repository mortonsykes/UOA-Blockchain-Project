import React, {Component} from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';

class TokensBought extends Component {
  constructor(props) {
    super(props);

    this.state = {
        columnDefs: [
            {headerName: "ID", field: "slotTokenTradeReceiptID", checkboxSelection: true},
            {headerName: "Voyage", field: "voyage", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Tokens Bought", field: "containerSlotQuantity_TEU", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "BuyOrderPriceLimit", field: "buyMaxPriceLimit", valueFormatter: AddCurrencySymbol},
            {headerName: "Price Paid", field: "sellMinPriceLimit", valueFormatter: AddCurrencySymbol},
            {headerName: "Total Value", field: "totalDue", valueFormatter: AddCurrencySymbol},
            {headerName: "Date", field: "created", valueFormatter: removeClassStringFromDataSimple, sort: "desc"},
            {headerName: "Buyer", field: "buyer", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Seller", field: "seller", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "BuyOrder", field: "buyOrder", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "SellOrder", field: "sellOrder", valueFormatter: removeClassStringFromDataSimple}
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

    fetch('/api/SlotTokenTradeReceipt')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    // .catch(error => this.setStatethis.setState([{make: "Please Log In", model: "", price: 0}]));
}

onFirstDataRendered(params) {
  params.api.sizeColumnsToFit();
}

render() {
    return (
      <div style={{ width: "100%", height: "100%", minheight: "100px" }}>
      
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Tokens Bought</h1>
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

function AddCurrencySymbol(params) {
  return '$'+ params.value.toString();
}

export default TokensBought;
