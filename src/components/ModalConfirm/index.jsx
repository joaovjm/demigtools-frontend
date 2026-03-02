import { useEffect } from "react"
import styles from "./modalconfirm.module.css"

export const ModalConfirm = ({
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar"
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape"){
                onClose();
            }
            if (e.keyCode === 89) {
                onConfirm()
            }
        }
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
    
        return () => {removeEventListener("keydown", handleKeyDown)}
    }, [isOpen, onClose]);

    if(!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h4>{title}</h4>
                <p>{message}</p>
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelButton}>{cancelText}</button>
                    <button onClick={onConfirm} className={styles.confirmButton}>{confirmText}</button>
                </div>
            </div>
        </div>
    )
  
}