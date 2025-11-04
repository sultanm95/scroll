import React from 'react';
import { Card } from "@/components/ui/card";

const CardNav = ({ children, active, onClick }) => {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
        active ? 'bg-accent text-accent-foreground' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </Card>
  );
};

export default CardNav;