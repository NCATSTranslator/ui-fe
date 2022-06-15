
import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Button from "../FormFields/Button";
import QueryItem from "../QueryComponents/QueryItem";

const QueryBar = ({handleSubmission, handleOnDragEnd, handleQueryItemChange, 
  handleRemoveQueryItem, isLoading, storedQuery}) => {

  return (
    <form onSubmit={handleSubmission}>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="query-item" direction="horizontal">
          {(provided) => (
            <ul className="query-box" {...provided.droppableProps} ref={provided.innerRef}>
              {storedQuery.map((item, index) => {
                let itemIsNode = (item.type === "node") ? true : false;
                return (
                  <Draggable key={index} draggableId={index.toString()} index={index} >
                    {(provided) => (
                      <li 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        {...provided.dragHandleProps} 
                        className="query-list-item">
                        <QueryItem 
                          item={item} 
                          handleClose={()=>handleRemoveQueryItem(index)} 
                          handleChange={handleQueryItemChange}
                          hasInput={itemIsNode}
                          name={item.name}
                          inputKey={index}
                          isSelected={item.selected}
                          inputActive>
                        </QueryItem>
                      </li>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <Button type="submit" size="s" disabled={isLoading}>
        <span>Submit Query</span>
      </Button>
    </form>
  )
}

export default QueryBar;