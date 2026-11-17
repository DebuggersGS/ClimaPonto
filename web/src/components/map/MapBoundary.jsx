import { Component } from 'react'

/** Captura falha ao carregar o chunk do mapa (rede) ou erro de renderização e avisa o invólucro. */
export default class MapBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFailure()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
