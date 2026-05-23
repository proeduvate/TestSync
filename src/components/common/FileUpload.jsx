import { useState, useRef } from 'react';
import { FiUploadCloud, FiFile, FiImage, FiVideo, FiX } from 'react-icons/fi';
import { formatFileSize } from '../../utils/helpers';
import './FileUpload.css';

function FileUpload({
    accept = '*',
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 5,
    value = [],
    onChange,
    label = 'Upload files',
    hint = 'Drag and drop files here, or click to browse',
    error,
}) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
        e.target.value = ''; // Reset input
    };

    const handleFiles = (files) => {
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                console.warn(`File ${file.name} exceeds maximum size`);
                return false;
            }
            return true;
        });

        const newFiles = multiple
            ? [...value, ...validFiles].slice(0, maxFiles)
            : validFiles.slice(0, 1);

        onChange(newFiles);
    };

    const removeFile = (index) => {
        const newFiles = value.filter((_, i) => i !== index);
        onChange(newFiles);
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) return <FiImage size={20} />;
        if (file.type.startsWith('video/')) return <FiVideo size={20} />;
        return <FiFile size={20} />;
    };

    const getPreview = (file) => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        return null;
    };

    return (
        <div className="file-upload-wrapper">
            {label && <label className="form-label">{label}</label>}

            <div
                className={`file-upload ${isDragging ? 'dragover' : ''} ${error ? 'error' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                <div className="file-upload-icon">
                    <FiUploadCloud size={40} />
                </div>
                <p className="file-upload-text">
                    <strong>Click to upload</strong> or drag and drop
                </p>
                <p className="file-upload-hint">{hint}</p>
                <p className="file-upload-hint">
                    Max {formatFileSize(maxSize)} per file
                    {multiple && ` • Up to ${maxFiles} files`}
                </p>
            </div>

            {error && <p className="form-error">{error}</p>}

            {value.length > 0 && (
                <div className="file-preview-list">
                    {value.map((file, index) => (
                        <div key={index} className="file-preview">
                            <div className="file-preview-thumb">
                                {file.type.startsWith('image/') ? (
                                    <img src={getPreview(file)} alt={file.name} />
                                ) : (
                                    getFileIcon(file)
                                )}
                            </div>
                            <div className="file-preview-info">
                                <p className="file-preview-name">{file.name}</p>
                                <p className="file-preview-size">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                type="button"
                                className="file-preview-remove"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                aria-label="Remove file"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FileUpload;
