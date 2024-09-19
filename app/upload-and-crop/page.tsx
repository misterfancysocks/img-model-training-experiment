import React from 'react';
import { UploadAndCrop } from '../../components/upload-and-crop';
import { getExistingShoots } from '@/actions/shoot-actions';

export default async function UploadAndCropPage() {
  const existingShoots = await getExistingShoots();

  return (
    <div>
      <h1>Upload and Crop</h1>
      {/* Render existing shoots and form fields */}
      {existingShoots.map((shoot) => (
        <div key={shoot.id}>
          <p>Shoot Name: {shoot.name}</p>
          {/* Add more shoot details as needed */}
        </div>
      ))}
      {/* Add your upload and crop form here */}
    </div>
  );
}