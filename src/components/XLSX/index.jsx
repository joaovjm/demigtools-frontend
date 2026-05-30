import *  as XLSX from "xlsx";
import {saveAs} from "file-saver";

function ExportToExcel ({jsonData, fileName}) {
    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const extension = ".xlsx";

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
        const blob = new Blob([excelBuffer], { type: fileType });
        saveAs(blob, fileName + extension);
    }

    return (
        <button onClick={exportToExcel}>Exportar para Excel</button>
    )
}

export default ExportToExcel;