import React, {Component} from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class MyBuyOrders extends Component {
  constructor(props) {
    super(props);

    this.state = {
        columnDefs: [
            {headerName: "ID", field: "slotTokenBuyOrderID", checkboxSelection: true},
            {headerName: "Voyage", field: "voyage.voyageID"},
            {headerName: "Quantity", field: "containerSlotQuantity_TEU"},
            {headerName: "Max Buy Price", field: "buyPriceLimit", valueFormatter: AddCurrencySymbol},
            {headerName: "Route", field: "voyage.route.routeID", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Origin", field: "voyage.originPort.portID", valueFormatter: removeClassStringFromDataSimple},            
            {headerName: "Destination", field: "voyage.destinationPort.portID", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Sail Date", field: "voyage.originArrivalTime_UTC", type: 'dateColumn'},

            {headerName: "Created", field: "createdByUser.userID", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Date", field: "created", type: 'dateColumn'},
            {headerName: "LastModifed", field: "lastModifiedByUser.userID", valueFormatter: removeClassStringFromDataSimple},
            {headerName: "Date", field: "lastModified", type: 'dateColumn'},
            {headerName: "Status", field: "status"},
            {headerName: "Voyage", field: "buyerToken.voyageSlot_TokenID", hide: true},

            //{headerName: "Owner", field: "Owner", valueFormatter: removeClassStringFromDataSimple},
            //cellStyle: {'white-space': 'pre-line'}, autoHeight: true,
        ],
        rowData: [],
        modal: false,
        modal2: false,
        modal_Quantity: 1,
        modal_Price: 10,
        getRowHeight: function(params) {
          return 100;    
      }
    }
    this.toggle = this.toggle.bind(this);
    this.toggle2 = this.toggle2.bind(this);
    this.editBuyOrder = this.editBuyOrder.bind(this);
    this.deleteBuyOrder = this.deleteBuyOrder.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handlePriceChange = this.handlePriceChange.bind(this);
  }

  handleChange(event) {
    this.setState({modal_Quantity: event.target.value});
  }
  handlePriceChange(event) {
    this.setState({modal_Price: event.target.value});
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  toggle2() {
    this.setState({
      modal2: !this.state.modal2
    });
  }

  editBuyOrder() {
    debugger;
    fetch('/api/VoyageToken_EditBuyOrder', {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        {
          $class: 'org.example.shipping.VoyageToken_EditBuyOrder',
          buyOrder: 'resource:org.example.shipping.SlotTokenBuyOrder#' + this.state.modal_SlotTokenBuyOrderID,
          voyageSlot_Token: 'resource:org.example.shipping.VoyageSlot_Token#' + this.state.modal_VoyageSlot_TokenID,
          quantity: parseInt(this.state.modal_Quantity),
          buyPrice: this.state.modal_Price,
          nextID: Date.now().toString()      
        })
    }).then(function(response) {
        if (!response.ok) {
          throw Error(response.status + ' ' + response.statusText);
        }
        return response;})
      .then(res => res.json())
      .then(res => alert("Transaction Succsesfull \n \n" + JSON.stringify(res)))
      .catch((error) => {console.log('error: ' + error);
        alert('error: ' + error);
        this.setState({ requestFailed: true });
    });

    this.setState({
      modal: !this.state.modal
    });

    fetch('/api/SlotTokenBuyOrder?filter={"include":"resolve"}')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    .catch(error => alert('Error fetching Orders: ' + error));
  }

  deleteBuyOrder() {
    debugger;
    fetch('/api/VoyageToken_PlaceBuyOrder/'+ this.state.modal_SlotTokenBuyOrderID, {
      method: 'delete',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        {})
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
      modal2: !this.state.modal2
    });

    fetch('/api/SlotTokenBuyOrder?filter={"include":"resolve"}')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    .catch(error => alert('Error fetching Orders: ' + error));
  }

onGridReady(params) {
  this.gridApi = params.api;
  this.gridColumnApi = params.columnApi;

  window.onresize = () => {
    this.gridApi.sizeColumnsToFit();
  }



//Get Data
    fetch('/api/SlotTokenBuyOrder?filter={"include":"resolve"}')
    .then(result => result.json())
    .then(rowData => this.setState({rowData}))
    .catch(error => alert('Error fetching Orders: ' + error));
}
    // componentDidMount() {
    //fetch('/api/SlotTokenBuyOrder?filter={"where": {"buyer": "Quote"},"include":"resolve"}')
    //   }

onFirstDataRendered(params) {
  params.api.sizeColumnsToFit();
}

render() {
    return (
      <div style={{ width: "100%", height: "100%", minheight: "100px" }}>

      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">My Carrier's Token Buy Orders</h1>
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
            <button type="button" class="btn btn-primary" onClick={this.onButtonClick}>&nbsp; Edit Buy Order &nbsp;</button>   
            <button style={{marginLeft: '2rem'}} type="button" class="btn btn-primary" onClick={this.onButtonClickDelete}>&nbsp; Delete Buy Order &nbsp;</button>        

        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          <ModalHeader toggle={this.toggle}><h3>Edit Buy Order</h3></ModalHeader>
          <ModalBody>
            <pre>
              <b>Buy Order ID: </b>{this.state.modal_SlotTokenBuyOrderID}
              <br/>
              <b>Voyage: </b>{this.state.modal_Voyage}
              <br/>
              <b>Route: </b>{this.state.modal_Route}
              <br/>
              <b>Origin: </b>{this.state.modal_Origin}
              <br/>
              <b>Destination: </b>{this.state.modal_Dest}
              <br/>
              <b>Sail Date: </b>{this.state.modal_SailDate}
              <br/>
              <b>Created By: </b>{this.state.modal_Created}
              <br/>
              <b>Last Modifed By: </b>{this.state.modal_LastModified}
              <br/>
              <br/>
              <b>New Quantity:     </b>
              <input type="number" value={this.state.modal_Quantity} onChange={this.handleChange}></input>
              <br/>
              <b>New Price Limit: </b>$
              <input type="number" value={this.state.modal_Price} onChange={this.handlePriceChange}></input>
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.editBuyOrder}>Confirm</Button>{' '}
            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.modal2} toggle={this.toggle2} className={this.props.className}>
          <ModalHeader toggle={this.toggle2}><h3>Confirm Delete</h3></ModalHeader>
          <ModalBody>
            <pre>
              <b>Buy Order ID: </b>{this.state.modal_SlotTokenBuyOrderID}
              <br/>
              <b>Voyage: </b>{this.state.modal_Voyage}
              <br/>
              <b>Route: </b>{this.state.modal_Route}
              <br/>
              <b>Origin: </b>{this.state.modal_Origin}
              <br/>
              <b>Destination: </b>{this.state.modal_Dest}
              <br/>
              <b>Sail Date: </b>{this.state.modal_SailDate}
              <br/>
              <b>Created By: </b>{this.state.modal_Created}
              <br/>
              <b>Last Modifed By: </b>{this.state.modal_LastModified}
              <br/>
              <br/>
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.deleteBuyOrder}>Confirm</Button>{' '}
            <Button color="secondary" onClick={this.toggle2}>Cancel</Button>
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
      this.setState({modal_SlotTokenBuyOrderID: selectedData[0].slotTokenBuyOrderID.toString(),
        modal_Route: selectedData[0].voyage.route.routeID.toString(),
        modal_SailDate: selectedData[0].voyage.originArrivalTime_UTC.toString(),
        modal_Origin: selectedData[0].voyage.originPort.portID.toString(),
        modal_Dest: selectedData[0].voyage.destinationPort.portID.toString(),
        modal_Voyage: selectedData[0].voyage.voyageID.toString(),
        modal_Created: selectedData[0].createdByUser.userID.toString(),
        modal_LastModified: selectedData[0].lastModifiedByUser.userID.toString(),
        modal_VoyageSlot_TokenID: selectedData[0].buyerToken.voyageSlot_TokenID.toString()  
      });  
      this.toggle();
    }else{
      alert('Please Select a Token');
    }   
  }

  onButtonClickDelete = e => {
    debugger;
    const selectedNodes = this.gridApi.getSelectedNodes()  
    if (selectedNodes.length > 0){
      const selectedData = selectedNodes.map( node => node.data )
      this.setState({modal_SlotTokenBuyOrderID: selectedData[0].slotTokenBuyOrderID.toString(),
        modal_Route: selectedData[0].voyage.route.routeID.toString(),
        modal_SailDate: selectedData[0].voyage.originArrivalTime_UTC.toString(),
        modal_Origin: selectedData[0].voyage.originPort.portID.toString(),
        modal_Dest: selectedData[0].voyage.destinationPort.portID.toString(),
        modal_Voyage: selectedData[0].voyage.voyageID.toString(),
        modal_Created: selectedData[0].createdByUser.userID.toString(),
        modal_LastModified: selectedData[0].lastModifiedByUser.userID.toString(),
        modal_VoyageSlot_TokenID: selectedData[0].buyerToken.voyageSlot_TokenID.toString()
      });  
      this.toggle2();
    }else{
      alert('Please Select a Token');
    }   
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

export default MyBuyOrders;
