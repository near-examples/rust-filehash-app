import 'regenerator-runtime/runtime';
import React, { Component } from 'react';
import logo from './assets/logo.svg';
import nearlogo from './assets/gray_near_logo.svg';
import near from './assets/near.svg';
import LoadingBubble from './img/another-bubble.gif';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: false,
      output: null,
      action: '', // add_file, remove_file, get_account
    }
    this.signedInFlow = this.signedInFlow.bind(this);
    this.requestSignIn = this.requestSignIn.bind(this);
    this.requestSignOut = this.requestSignOut.bind(this);
    this.signedOutFlow = this.signedOutFlow.bind(this);
  }

  componentDidMount() {
    let loggedIn = this.props.wallet.isSignedIn();
    if (loggedIn) {
      this.signedInFlow();
    } else {
      this.signedOutFlow();
    }
    document.getElementById('input-file').onchange = (e) => {
      this.upload(e.target)
      document.getElementById('input-file').value = null
    }
  }

  async signedInFlow() {
    console.log("come in sign in flow")
    this.setState({
      login: true,
    })
    const accountId = await this.props.wallet.getAccountId()
    if (window.location.search.includes("account_id")) {
      window.location.replace(window.location.origin + window.location.pathname)
    }
  }

  async requestSignIn() {
    const appTitle = 'Rust File Hash Example';
    await this.props.wallet.requestSignIn(
      window.nearConfig.contractName,
      appTitle
    )
  }

  requestSignOut() {
    this.props.wallet.signOut();
    setTimeout(this.signedOutFlow, 500);
    console.log("after sign out", this.props.wallet.isSignedIn())
  }

  signedOutFlow() {
    if (window.location.search.includes("account_id")) {
      window.location.replace(window.location.origin + window.location.pathname)
    }
    this.setState({
      login: false,
      speech: null
    })
  }


  /********************************
  
  ********************************/
  handleClick(action) {
    this.setState({ action, output: '' })
    document.getElementById('input-file').click()
  }
  async upload(target) {
    this.setState({ loading: true }) // selected file
    const file = target.files[0]
    const reader = new FileReader();
    reader.onloadend = async (e) => {
      // const encoded = new TextEncoder().encode('test') // debugging
      const u8 = await window.crypto.subtle.digest({ name: "SHA-256" }, e.target.result)
      const hash = [...new Uint8Array(u8)]
      const result = await this.props.contract[this.state.action]({ hash })
      this.setState({ loading: false }) // regardless of outcome bring down the loading screen
      const signerAccountId = this.props.wallet.account().accountId
      switch (this.state.action) {
        case 'add_file':
          if (result === true) {
            this.setState({ output: `AccountId ${signerAccountId} added for file: ${file.name}` })
          } else {
            this.setState({ output: `There is already a hash for file: ${file.name}` })
          }
          break;
        case 'remove_file':
          if (result === true) {
            this.setState({ output: `AccountId ${signerAccountId} removed for file: ${file.name}` })
          } else {
            this.setState({ output: `Your not authorized to remove the AccountId for file: ${file.name}` })
          }
        break;
        case 'get_account':
          if (result.length === 0) {
            this.setState({ output: `No AccountId found for file: ${file.name}` })
          } else {
            this.setState({ output: `AccountId: ${result} verified for file: ${file.name}` })
          }
        break;
      }
    }
    reader.readAsArrayBuffer(file);
  }

  render() {

    const { loading, output, login } = this.state

    return (
      <>
      { 
        loading && 
        <div className="loading-overlay">
          <img src={LoadingBubble} />
        </div>
      }
      <div className="App-header">

        <div className="image-wrapper">
          <img className="logo" src={nearlogo} alt="NEAR logo" />
        </div>
        <div>
          {login ? 
            <div>
              <button onClick={() => this.handleClick('add_file')}>Add File</button>
              <button onClick={() => this.handleClick('get_account')}>Verify File</button>
              <button onClick={() => this.handleClick('remove_file')}>Remove File</button>
              <button onClick={this.requestSignOut}>Log out</button>
            </div> :
            <button onClick={this.requestSignIn}>Log in with NEAR</button>}
        </div>
        <div>
          <p>
          {output ? <>
            <span role="img" aria-label="chain"> ⛓ </span>
            {output}
            <span role="img" aria-label="chain"> ⛓ </span>
            </>
          : <span>&nbsp;</span>}
          </p>
        </div>
        <input id="input-file" type="file" style={{display: 'none'}} />
      </div>
      </>
    )
  }

}

export default App;
