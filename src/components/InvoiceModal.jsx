import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import waterMark from "../Bistro.png";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const InvoiceModal = ({
  isOpen,
  setIsOpen,
  invoiceInfo,
  items,
  onAddNextInvoice,
}) => {
  function closeModal() {
    setIsOpen(false);
  }

  const addNextInvoiceHandler = () => {
    if (items.length === 0) {
      alert("Please add at least one item before proceeding.");
      return; // Exit the function if there are no items
    }

    setIsOpen(false);
    onAddNextInvoice();
  };

  const SaveAsPDFHandler = () => {
    const d = document.getElementById("print");
    const watermarkImageUrl = waterMark;

    Promise.all([toPng(d), loadImage(watermarkImageUrl)])
      .then(([url, watermarkImage]) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.src = url;
        i.onload = () => {
          const p = new jsPDF({
            orientation: "portrait",
            unit: "in",
            format: [5.5, 5.5],
          });

          const imgProps = p.getImageProperties(i);
          const type = imgProps.fileType;
          const width = p.internal.pageSize.getWidth();
          const fullHeight = imgProps.height;
          const pageHeightPx = Math.floor((imgProps.width * 8.5) / 5.5);
          const pages = Math.ceil(fullHeight / pageHeightPx);
          let pageHeight = p.internal.pageSize.getHeight();
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = imgProps.width;
          canvas.height = pageHeightPx;

          const now = new Date();
          const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          };
          const timestamp = now
            .toLocaleString("en-US", options)
            .replace(/\/|\s|:/g, "-"); // Format timestamp
          const invoicedText = `Invoiced on: ${new Date().toLocaleString()}`;

          for (let pg = 0; pg < pages; pg++) {
            if (pg === pages - 1 && fullHeight % pageHeightPx !== 0) {
              canvas.height = fullHeight % pageHeightPx;
              pageHeight = (canvas.height * width) / canvas.width;
            }
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the watermark image
            const wmWidth = canvas.width * 0.8;
            const wmHeight =
              (watermarkImage.height / watermarkImage.width) * wmWidth;
            ctx.globalAlpha = 0.3;
            ctx.drawImage(
              watermarkImage,
              (canvas.width - wmWidth) / 2,
              (canvas.height - wmHeight) / 2,
              wmWidth,
              wmHeight
            );
            ctx.globalAlpha = 1.0;

            ctx.drawImage(
              i,
              0,
              pg * pageHeightPx,
              canvas.width,
              canvas.height,
              0,
              0,
              canvas.width,
              canvas.height
            );

            if (pg) p.addPage();
            p.addImage(
              canvas.toDataURL(`image/${type}`, 1),
              type,
              0,
              0,
              width,
              pageHeight
            );

            // Add the invoiced text and timestamp to the top of each page
            p.text(invoicedText, 0.5, 5.3);
          }

          p.save(`invoice-${timestamp}.pdf`); // Save with formatted timestamp
        };
      })
      .catch((e) => console.error("error!", e));
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={closeModal}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
              <div
                className="bg-cover bg-no-repeat p-4"
                id="print"
                style={{
                  backgroundImage: "../../src/photo.jfif",
                }}
              >
                <h1 className="text-center text-lg font-bold text-gray-900">
                  INVOICE
                </h1>
                <div className="mt-6">
                  <div className="mb-4 grid grid-cols-2">
                    <span className="font-bold">Invoice Number:</span>
                    <span>{invoiceInfo.invoiceNumber}</span>
                    <span className="font-bold">Cashier:</span>
                    <span>{invoiceInfo.cashierName}</span>
                    <span className="font-bold">Customer:</span>
                    <span>{invoiceInfo.customerName}</span>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-y border-black/10 text-sm md:text-base">
                        <th>ITEM</th>
                        <th className="text-center">QTY</th>
                        <th className="text-right">PRICE</th>
                        <th className="text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="w-full">{item.name}</td>
                          <td className="min-w-[50px] text-center">
                            {item.qty}
                          </td>
                          <td className="min-w-[80px] text-right">
                            ${Number(item.price).toFixed(2)}
                          </td>
                          <td className="min-w-[90px] text-right">
                            ${Number(item.price * item.qty).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex flex-col items-end space-y-2">
                    <div className="flex w-full justify-between border-t border-black/10 pt-2">
                      <span className="font-bold">Subtotal:</span>
                      <span>${invoiceInfo.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex w-full justify-between">
                      <span className="font-bold">Discount:</span>
                      <span>${invoiceInfo.discountRate.toFixed(2)}</span>
                    </div>
                    <div className="flex w-full justify-between">
                      <span className="font-bold">Tax:</span>
                      <span>${invoiceInfo.taxRate.toFixed(2)}</span>
                    </div>
                    <div className="flex w-full justify-between border-t border-black/10 py-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold">
                        $
                        {invoiceInfo.total % 1 === 0
                          ? invoiceInfo.total
                          : invoiceInfo.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-2 px-4 pb-6">
                <button
                  className="flex w-full items-center justify-center space-x-1 rounded-md border border-blue-500 py-2 text-sm text-blue-500 shadow-sm hover:bg-blue-500 hover:text-white"
                  onClick={SaveAsPDFHandler}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download</span>
                </button>
                <button
                  onClick={printInvoice}
                  className="flex w-full items-center justify-center space-x-1 rounded-md border border-green-500 py-2 text-sm text-green-500 shadow-sm hover:bg-green-500 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10h14M5 6h14M9 14h6m-8 4h10v2H7v-2z"
                    />
                  </svg>
                  <span>Print</span>
                </button>
                <button
                  onClick={addNextInvoiceHandler}
                  className="flex w-full items-center justify-center space-x-1 rounded-md bg-blue-500 py-2 text-sm text-white shadow-sm hover:bg-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                  <span>Next</span>
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InvoiceModal;
