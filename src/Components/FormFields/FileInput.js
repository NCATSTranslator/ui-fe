import React, {useState, useEffect} from "react";
import styles from './FileInput.module.scss';

const FileInput = ({buttonLabel, size, fileTypes}) => {
  
  const [files, setFiles] = useState(null);
  size = (size) ? size : 's';

  const handleChange = (e) => {
    console.log(e.target.files);
    let fileNameArray = Array.from(e.target.files).map((item)=>{
      return item.name;
    })
    console.log(fileNameArray);
    setFiles(fileNameArray);
  }

  return (

    <label htmlFor={`file-upload`} className={`file-input ${styles.fileInput} ${size}`}>
      <span className={styles.fileList}>
        {(files) ?
          files.join(', ') :
          'No Files Selected'}
      </span>
      <input 
        type="file" 
        accept={fileTypes}
        id="file-upload" 
        onChange={(e)=> handleChange(e)}
        multiple
      />
      <span className={styles.buttonLabel}>{buttonLabel}</span>
    </label>

  );
}


export default FileInput;