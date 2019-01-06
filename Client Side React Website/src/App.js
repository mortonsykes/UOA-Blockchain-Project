import React, { Component } from 'react';
import {Route, withRouter} from 'react-router-dom';
import NavBar from './NavBar/NavBar';
import Sidebar from './Pages/Sidebar';
import Shipment_Job from './Pages/Shipment_Job';
import Shipment_JobNoContainer from './Pages/Shipment_JobNoContainer';
import Shipment_JobBooked from './Pages/Shipment_JobBooked';
import ShipRoute from './Pages/ShipRoute';
import Voyages from './Pages/Voyages';
import Ship from './Pages/Ship';
import Container from './Pages/Container';
import ContainerYard from './Pages/ContainerYard';
import VoyageTokens from './Pages/VoyageTokens';
import TokensSold from './Pages/TokenSold';
import TokensBought from './Pages/TokenBought';
import MyBuyOrders from './Pages/MyBuyOrders';
import AllBuyOrders from './Pages/AllBuyOrders';
import MySellOrders from './Pages/MySellOrders';
import AllSellOrders from './Pages/AllSellOrders';


import History from './Pages/History';


class App extends Component {
  constructor () {
    super()

    this.state = {
      isLoggedIn: false,
      username: "...Loading..."
    };
  }

  async componentDidMount() {

    fetch('/api/wallet')
    .then(result => result.json())
    .then(rowData => this.setState({isLoggedIn: true, username: rowData[0].name}))
    .catch(error => this.setState({isLoggedIn: false, username: ""}));
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <NavBar
          isLoggedIn = {this.state.isLoggedIn}
          name = {this.state.username}
        />
        <div className="container-fluid" style={{ width: "100%", height: "100%" }} >
        <Sidebar isLoggedIn = {this.state.isLoggedIn}/>
        <main role="main" className="col-md-9 ml-sm-auto col-lg-10" style={{ width: "100%", height: "100%" }}>
        
        {this.state.isLoggedIn &&
          <div>
            <Route exact path='/Jobs' component={Shipment_Job}/>
            <Route exact path='/JobsNoContainer' component={Shipment_JobNoContainer}/>
            <Route exact path='/JobsBooked' component={Shipment_JobBooked}/>

            <Route exact path='/Routes' component={ShipRoute}/>
            <Route exact path='/Voyages' component={Voyages}/>
            <Route exact path='/Vessels' component={Ship}/>
            <Route exact path='/Container' component={Container}/>
            <Route exact path='/ContainerYard' component={ContainerYard}/>
            
            <Route exact path='/VoyageTokens' component={VoyageTokens}/>
            <Route exact path='/TokenSold' component={TokensSold}/>
            <Route exact path='/TokenBought' component={TokensBought}/> 
            <Route exact path='/MyBuyOrders' component={MyBuyOrders}/> 
            <Route exact path='/AllBuyOrders' component={AllBuyOrders}/> 
            <Route exact path='/MySellOrders' component={MySellOrders}/> 
            <Route exact path='/AllSellOrders' component={AllSellOrders}/> 
            
            <Route exact path='/History' component={History}/>
          </div>
        }
      

        </main>

        </div>
      </div>
    );
  }
}

export default withRouter(App);

export function removeClassStringFromData(params) {
  return params.value.toString().replace(/resource:org.example.shipping./g, '').replace(/,/g, ',\n');
}
export function removeClassStringFromDataSimple(params) {
  if (params.value){
    return params.value.toString().replace('resource:org.example.shipping.', '');
  }else{
    return '';
  }
}
