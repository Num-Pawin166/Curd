import React, { Component } from 'react'
import config from './config'

// import App from 'base-shell/lib'
import App from './containers/App/App'

export default class Demo extends Component {
  render() {
    return <App config={config} />
  }
}
