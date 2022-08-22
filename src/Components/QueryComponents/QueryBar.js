
import React from "react";
import Button from "../FormFields/Button";
import QueryItem from "../QueryComponents/QueryItem";

const QueryBar = ({handleSubmission, handleOnDragEnd, handleQueryItemChange, 
  handleRemoveQueryItem, isLoading, storedQuery}) => {

  return (
    <form onSubmit={handleSubmission}>
      <Button type="submit" size="s" disabled={isLoading}>
        <span>Submit Query</span>
      </Button>
    </form>
  )
}

export default QueryBar;