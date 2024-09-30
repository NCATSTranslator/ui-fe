import { useState } from "react";
import styles from './FileInput.module.scss';

const FileInput = ({buttonLabel, fileTypes, handleChange}) => {
  
  const [fileNames, setFileNames] = useState(null);
  handleChange = (handleChange) ? handleChange : ()=>{ console.log('No handleChange function prop provided to FileInput component.')};

  const handleUpdate = (e) => {
    let fileNameArray = Array.from(e.target.files).map((item)=>{
      return item.name;
    })
    setFileNames(fileNameArray);
    let fileArray = Array.from(e.target.files).map((item)=>{
      return item;
    })
    handleChange(fileArray);
  }

  return (

    <label htmlFor={`file-upload`} className={`file-input ${styles.fileInput}`}>
      <span className={styles.fileList}>
        {(fileNames) ?
          fileNames.join(', ') :
          'No Files Selected'}
      </span>
      <input 
        type="file" 
        accept={fileTypes}
        id="file-upload" 
        onChange={(e)=> handleUpdate(e)}
        multiple
      />
      <span className={styles.buttonLabel}>{buttonLabel}</span>
    </label>

  );
}


export default FileInput;