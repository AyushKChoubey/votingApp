import { useEffect } from "react";
import { registerModalClose } from "../services/backHandler";

/**
 * Hook to automatically register/unregister modal close handlers with Android Back button
 * @param {boolean} isOpen - Whether the modal/drawer/sheet is currently open
 * @param {Function} onClose - The callback to close the modal
 */
export function useRegisterModal(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen || typeof onClose !== "function") return;
    const unregister = registerModalClose(onClose);
    return unregister;
  }, [isOpen, onClose]);
}

export default useRegisterModal;

