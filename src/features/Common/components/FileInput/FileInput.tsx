import { FC, ReactNode, useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import ExportIcon from '@/assets/icons/buttons/Export.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import styles from './FileInput.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { CustomFile } from '@/features/Common/types/global';

type FileDropInputProps = {
  handleChange: (files: CustomFile[] ) => void;
  multiple?: boolean;
  disabled?: boolean;
  testId?: string;
  label?: string | ReactNode;
  buttonLabel?: string;
  fileTypes?: string;
};

const FileInput: FC<FileDropInputProps> = ({
  handleChange,
  multiple = false,
  disabled = false,
  label = "File Input",
  testId,
  buttonLabel = "Browse Files",
  fileTypes = ".png,.jpg,.jpeg"
}) => {
  
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<CustomFile[] | null>(null);

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return; // Do nothing if it's still within the main element
    }

    setDragging(false);
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    let newFiles = getFileArrayFromFileList(e.dataTransfer.files, files);
    setFilesAndHandleChange(newFiles);
  }

  const getFileArrayFromFileList = (list: FileList | null, currentFiles: CustomFile[] | null) => {
    if(!list)
      return false;

    let newFiles = [];
    for(const file of list) {
      let newFile: CustomFile = {
        file: file,
        thumbnailURL: URL.createObjectURL(file)
      }
      newFiles.push(newFile);
    }
    if(!!currentFiles && currentFiles.length > 0 && !!newFiles)
      newFiles = [...currentFiles, ...newFiles];

    return newFiles;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = getFileArrayFromFileList(e.target.files, files);
    setFilesAndHandleChange(newFiles);
  }

  const handleClick = () => {
    inputRef.current?.click();
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = (!!files) ? files.toSpliced(index, 1) : files;
    setFilesAndHandleChange(newFiles);
  }
  
  const setFilesAndHandleChange = (newFiles: CustomFile[] | false | null) => {
    if(!!newFiles) {
      setFiles(newFiles);
      handleChange(newFiles);
    }
  }

  useEffect(() => {
    return () => {
      if(!!files && files.length > 0) {
        for(const file of files) {
          if(!!file.thumbnailURL)
            URL.revokeObjectURL(file.thumbnailURL);
        }
      }
    };
  }, [files]);

  return (
    <label
      className={`${styles.fileDropZone} ${dragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''} file-input ${styles.fileInput}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid={testId}
      htmlFor={`file-upload`}
      >
      <span className="input-label-container">
        {label && <span className="input-label">{label}</span>}
      </span>
      <div className={styles.container}>
        <div className={styles.top}>
          <input
            ref={inputRef}
            type="file"
            accept={fileTypes}
            multiple={multiple}
            disabled={disabled}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {
            dragging
            ?
              <span className={styles.dropText}>Drop file here...</span>
            :
              <>
                <span className={styles.dropText}>Drag & Drop to Upload or</span>
                <Button 
                  handleClick={!disabled ? handleClick : undefined}
                  className={styles.buttonLabel}
                  variant="secondary"
                  >
                  <ExportIcon/>{buttonLabel}
                </Button>
              </>
          }
        </div>
        {
          (!!files && files.length > 0) &&
          <div className={styles.fileList}>
            {
              files.map((file, i) => {
                return (
                  <div className={styles.file} key={file.file.name}>
                    <div className={styles.left}>
                      <div className={styles.thumb} >
                        <img src={URL.createObjectURL(file.file)} alt={file.file.name} />
                      </div>
                      <span className={styles.name}>{file.file.name}</span>
                    </div>
                    <CloseIcon onClick={()=>handleRemoveFile(i)} className={styles.remove}/>
                  </div>
                )
              })
            }
          </div>
        }
      </div>
    </label>
  );
};

export default FileInput;
