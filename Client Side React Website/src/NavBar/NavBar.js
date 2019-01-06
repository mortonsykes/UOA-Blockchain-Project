import React, { Component } from 'react';
import {Link, withRouter} from 'react-router-dom';

class NavBar extends Component { 
  constructor (props) {
  super(props)
  this.GoogleAuthenticate = this.GoogleAuthenticate.bind(this);

  this.state = {
    isLoggedIn : props.isLoggedIn,
    name: props.name
    }
  }

	componentWillReceiveProps(nextProps) {
    console.log("recive props")
		this.setState({     
      isLoggedIn : nextProps.isLoggedIn,
      name: nextProps.name});  
  }

  GoogleAuthenticate () {
   window.location.href='http://localhost:3000/auth/google';
  }
  
  render() {
    return (
      <nav className="navbar navbar-expand navbar-dark bg-primary fixed-top">
        <Link className="navbar-brand" to="/">
          Ocean Shipping Carrier Alliance Blockchain
        </Link>

      <div className="collapse navbar-collapse" id="navbarSupportedContent">
      <ul className="navbar-nav mr-auto">
        <li className="nav-item ">
          <a className="nav-link" href="/">Home <span className="sr-only">(current)</span></a>
        </li>

      </ul>
      </div>

        {
          !this.state.isLoggedIn &&
          <button className="btn btn-dark" onClick={this.GoogleAuthenticate}>Sign In</button>
        }
        {
          this.state.isLoggedIn &&
          <div>
            <label className="mr-2 text-white">{this.state.name}</label>
            <button className="btn btn-dark" onClick={() => {window.location.href='http://localhost:3000/auth/logout'}}>Sign Out</button>
          </div>
        }
      </nav>
    );
  }
}

export default withRouter(NavBar);
