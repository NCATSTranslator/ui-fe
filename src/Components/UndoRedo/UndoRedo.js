import React from 'react';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import { connect } from 'react-redux';
import Button from '../FormFields/Button';
import {ReactComponent as Undo} from '../../Icons/Directional/Undo.svg';
import {ReactComponent as Redo} from '../../Icons/Directional/Redo.svg';

let UndoRedo = ({ canUndo, canRedo, onUndo, onRedo }) => {


  return (
    <div className='undo-redo-container'>
      <Button isSecondary handleClick={onUndo} disabled={!canUndo} size="m"><Undo/>Undo</Button>
      <Button isSecondary handleClick={onRedo} disabled={!canRedo} size="m"><Redo/>Redo</Button>
    </div>
  )
}

const mapStateToProps = state => {
  return {
    canUndo: state.query.past.length > 0,
    canRedo: state.query.future.length > 0
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onUndo: () => dispatch(UndoActionCreators.undo()),
    onRedo: () => dispatch(UndoActionCreators.redo())
  }
}

UndoRedo = connect(mapStateToProps, mapDispatchToProps)(UndoRedo)

export default UndoRedo;