"use client"
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AgGridReact } from 'ag-grid-react';


export default function Logs() {
    const [logs, setLogs] = useState<any>([]);
    const [warningLogs, setWarningLogs] = useState<any>([]);

    useEffect(() => {
        const socket = io('http://localhost:3000');

        socket.on('log', (log) => {
            setLogs((logs:any) => [...logs, log]);
        });

        socket.on('warningLog', (warningLog) => {
            setWarningLogs((warningLogs:any) => [...warningLogs, warningLog]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Define the columns for the logs table
    const logsColumns = [
        {
            headerName: 'Device ID',
            field: 'DeviceID',
        },
        {
            headerName: 'Device Time',
            field: 'DeviceTime',
        },
        {
            headerName: 'Latitude',
            field: 'Latitude',
        },
        {
            headerName: 'Longitude',
            field: 'Longitude',
        },
        {
            headerName: 'Altitude',
            field: 'Altitude',
        },
        {
            headerName: 'Course',
            field: 'Course',
        },{
            headerName: 'Satellites',
            field: 'Satellites',
        },{
            headerName: 'SpeedOTG',
            field: 'SpeedOTG',
        },{
            headerName: 'AccelerationX1',
            field: 'AccelerationX1',
        },{
            headerName: 'AccelerationY1',
            field: 'AccelerationY1',
        },{
            headerName: 'Signal',
            field: 'Signal',
        },{
            headerName: 'PowerSupply',
            field: 'PowerSupply',
        }
    ];

    // Define the columns for the warning logs table
    const warningLogsColumns = [
        {
            headerName: 'Device ID',
            field: 'DeviceID',
        },
        {
            headerName: 'Warning Time',
            field: 'WarningTime',
        },
        {
            headerName: 'Warning Type',
            field: 'WarningType',
        },
    ];

    return (
        <>
            <p className="bg-white border border-gray-300 p-2 shadow-lg my-2 rounded-md">Here are the real-time data from MQTT</p>
            <h1 className="bg-white border border-gray-300 p-2 shadow-lg my-2 rounded-md">Logs</h1>
            <div className="ag-theme-alpine" style={{ height: 400, width: "80%" }}>
                <AgGridReact rowData={logs} columnDefs={logsColumns} />
            </div>

            <h1 className="bg-white border border-gray-300 p-2 shadow-lg my-2 rounded-md">Warning Logs</h1>
            <div className="ag-theme-alpine" style={{ height: 400, width: "80%" }}>
                <AgGridReact rowData={warningLogs} columnDefs={warningLogsColumns} />
            </div>
        </>
    );
}
