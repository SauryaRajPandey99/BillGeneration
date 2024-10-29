import React from "react";

const Toast = ({ message, onClose }) => {
  return (
    <div
      className="fixed bottom-5 right-5 w-80 transform rounded-lg bg-red-500 p-4 text-white shadow-lg transition-transform"
      style={{ transform: message ? "translateY(0)" : "translateY(100%)" }}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2">
          ✖
        </button>
      </div>
    </div>
  );
};

export default Toast;
