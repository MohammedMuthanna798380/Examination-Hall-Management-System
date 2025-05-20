import React from "react";

const Table = ({ headers, data, actionColumn, onAction }) => {
  return (
    <table className="mini-table">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {Object.values(row).map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
            {actionColumn && (
              <td>
                <button className="table-btn" onClick={() => onAction(row)}>
                  {actionColumn}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
