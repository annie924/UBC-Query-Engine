//With Helpfrom ChatGPT
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const CustomDropzone: React.FC<{ onFileUpload?: (file: File) => void }> = ({ onFileUpload }) => {
	const [fileName, setFileName] = useState<string | null>(null)

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			const file = acceptedFiles[0]
			setFileName(file.name)
			onFileUpload?.(file)
		}
	}, [onFileUpload])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

	return (
		<div>
			<div
				{...getRootProps()}
				className="relative w-full h-64 border-2 border-dashed border-gray-300 rounded-md bg-gray-100 bg-opacity-50 flex justify-center items-center transition-colors hover:bg-opacity-75"
			>
				<input {...getInputProps()} />
				<span className="text-6xl text-gray-500">+</span>
				{isDragActive && (
					<div className="absolute inset-0 flex justify-center items-center bg-gray-200 bg-opacity-70">
						<p className="text-xl text-gray-700">Drop files here...</p>
					</div>
				)}
			</div>
			{fileName && (
				<p className="mt-2 text-center text-gray-700">{fileName}</p>
			)}
		</div>
	)
}

export default CustomDropzone;
