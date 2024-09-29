import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function TryItNowButton() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    checkUserProfile('2');
    setIsLoaded(true);
  }, []);

  const checkUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/user-profile/${userId}`);
      const data = await response.json();
      setHasProfile(data.exists);
    } catch (error) {
      console.error("Error checking user profile:", error);
    }
  };

  const handleClick = () => {
    if (!isLoaded) return;

    if (hasProfile) {
      router.push('/person-setup');
    } else {
      router.push('/person-setup');
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={!isLoaded}
      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
    >
      {!isLoaded ? 'Loading...' : 'Try It Now'}
    </Button>
  );
}