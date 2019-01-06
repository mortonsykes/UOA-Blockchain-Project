import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';
import axios from 'axios';

class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  async componentDidMount() {
  }

  render() {
    return (


<div className="row">
  <nav className="col-md-2 d-none d-md-block bg-light sidebar">
    <div className="sidebar-sticky">

      <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
        <span>Shipment Jobs</span>
        <a className="d-flex align-items-center text-muted" href="#">
          <span data-feather="plus-circle"></span>
        </a>
      </h6>
      <ul className="nav flex-column">
        <li className="nav-item">
        <NavLink to="/Jobs" activeClassName="active" className="nav-link active">
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shopping-cart"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> */}
          Unbooked
        </NavLink>
        </li>

        <li className="nav-item" >
        <NavLink to="/JobsNoContainer" activeClassName="active" className="nav-link active">
            Booked - Needs Container</NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/JobsBooked" activeClassName="active" className="nav-link active"> 
          Booked or Completed
          </NavLink>
        </li>
      </ul>

      <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
        <span>Ship</span>
        <a className="d-flex align-items-center text-muted" href="#">
          <span data-feather="plus-circle"></span>
        </a>
      </h6>
      <ul className="nav flex-column">

        <li className="nav-item">
        <NavLink to="/Routes" activeClassName="active" className="nav-link active"> 
          Routes 
        </NavLink>
        </li>

        <li className="nav-item">
        <NavLink to="/Voyages" activeClassName="active" className="nav-link active">  
          Voyages
        </NavLink>
        </li>

        <li className="nav-item">
        <NavLink to="/Vessels" activeClassName="active" className="nav-link active"> 
          Ships
        </NavLink>
        </li>

        <li className="nav-item">
        <NavLink to="/Container" activeClassName="active" className="nav-link active"> 
          Containers
        </NavLink>
        </li>

        <li className="nav-item">
        <NavLink to="/ContainerYard" activeClassName="active" className="nav-link active"> 
          Container Yards
        </NavLink>
        </li>
      </ul>

      <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
        <span>Voyage Tokens</span>
        <a className="d-flex align-items-center text-muted" href="#">
          <span data-feather="plus-circle"></span>
        </a>
      </h6>
      <ul className="nav flex-column">
        <li className="nav-item">
        <NavLink to="/VoyageTokens" activeClassName="active" className="nav-link active"> 
          
          My Tokens
        </NavLink>
        </li>

        <li className="nav-item">
        <NavLink to="/TokenBought" activeClassName="active" className="nav-link active"> 
          
          Tokens Bought
        </NavLink>
        </li>
        <li className="nav-item">
        <NavLink to="/TokenSold" activeClassName="active" className="nav-link active"> 
  
          Tokens Sold
        </NavLink>
        </li>
        </ul>

        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
        <span>Token MarketPlace</span>
        <a className="d-flex align-items-center text-muted" href="#">
          <span data-feather="plus-circle"></span>
        </a>
        </h6>
      <ul className="nav flex-column">
      <li className="nav-item">
        <NavLink to="/MyBuyOrders" activeClassName="active" className="nav-link active"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          My Buy Orders
        </NavLink>
        </li>

                <li className="nav-item">
        <NavLink to="/AllBuyOrders" activeClassName="active" className="nav-link active"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          All Buy Orders
        </NavLink>
        </li>

                <li className="nav-item">
        <NavLink to="/MySellOrders" activeClassName="active" className="nav-link active"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          My Sell Orders
        </NavLink>
        </li>

                <li className="nav-item">
        <NavLink to="/AllSellOrders" activeClassName="active" className="nav-link active"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          All Sell Orders
        </NavLink>
        </li>
        </ul>

        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
        <span>Transaction History</span>
        <a className="d-flex align-items-center text-muted" href="#">
          <span data-feather="plus-circle"></span>
        </a>
        </h6>
      <ul className="nav flex-column">

        <li className="nav-item">
        <NavLink to="/History" activeClassName="active" className="nav-link active"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Transaction History
        </NavLink>
        </li>
      
      </ul>
    </div>
  </nav>

  {!this.props.isLoggedIn &&  
    <main role="main" className="col-md-9 ml-sm-auto col-lg-10 px-4">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Please Sign in to Access the Network</h1>
        <div className="btn-toolbar mb-2 mb-md-0">
          <div className="btn-group mr-2">
            <button className="btn btn-sm btn-outline-secondary">Print</button>
            <button className="btn btn-sm btn-outline-secondary">Export</button>
          </div>
        </div>
      </div>
    </main>
  }
</div>


    )
  }
}

export default Sidebar;
