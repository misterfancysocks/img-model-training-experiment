'use client';

import { useEffect, useState } from 'react';
import Header from "@/components/header";
import ReviewImages from "@/components/review-images";

export default function ReviewImagesPage() {
  const [personId, setPersonId] = useState<string>('1'); // Default to '1'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPersonId = localStorage.getItem('currentPersonId');
      if (storedPersonId) {
        setPersonId(storedPersonId);
        console.log('retrieved personId from local storage', storedPersonId);
      } else {
        console.log('No personId found in local storage, defaulting to 1');
      }
    }
  }, []);

  return (
    <>
      <Header />
      <ReviewImages personId={personId} />
    </>
  );
}