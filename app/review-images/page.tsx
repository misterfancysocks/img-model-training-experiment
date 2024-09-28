'use client';

import { useEffect, useState } from 'react';
import Header from "@/components/header";
import ReviewImages from "@/components/review-images";

export default function ReviewImagesPage() {
  const [personId, setPersonId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPersonId = localStorage.getItem('currentPersonId');
      if (storedPersonId) {
        setPersonId(storedPersonId);
        console.log('Retrieved personId from local storage:', storedPersonId);
      } else {
        console.error('No personId found in local storage');
        // You might want to redirect to an error page or the setup page here
      }
    }
  }, []);

  if (personId === null) {
    return <div>Loading...</div>; // Or some other loading indicator
  }

  return (
    <>
      <Header />
      <ReviewImages personId={personId} />
    </>
  );
}