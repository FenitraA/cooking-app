"use client";

import { Modal, ModalBody } from "flowbite-react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type DeleteModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function DeleteConfirmModal({
  open,
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  onCancel,
  onConfirm,
  loading = false,
}: DeleteModalProps) {

  const general_translations = useTranslations("General");

  if (!open) return null;

  return (
    <Modal
      size="2xl"
      show={open}
      onClose={onCancel}
    >
      <ModalBody className="bg-custom-dark-blue border border-custom-sand-dune">
        <div className="flex text-xl text-custom-sand-dune flex-row justify-between w-full mb-3 pb-3 border-b border-custom-sand-dune">
          <h2>{general_translations("delete_confirmation_title")}</h2>
          <button
            className="flex justify-center items-center cursor-pointer h-6 w-6 border border-custom-sand-dune rounded-full text-custom-sand-dune hover:bg-custom-sand-dune/20"
            onClick={onCancel}
            aria-label={general_translations("actions.select")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-300 mb-5">{message}</p>

        {/* Actions */}
        <div className="flex flex-row justify-end gap-6">
          <button
            onClick={onCancel}
            className="h-10 w-36 px-3 py-1.5 rounded-md text-gray-200 text-sm bg-white/20 hover:bg-gray-800 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-10 w-36 px-3 py-1.5 rounded-md text-sm bg-custom-button-red text-white hover:bg-custom-button-red/80 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
