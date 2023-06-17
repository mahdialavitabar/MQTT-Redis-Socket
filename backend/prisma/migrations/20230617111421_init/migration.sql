-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "DeviceID" TEXT NOT NULL,
    "DeviceTime" TIMESTAMP(3) NOT NULL,
    "Latitude" DOUBLE PRECISION NOT NULL,
    "Longitude" DOUBLE PRECISION NOT NULL,
    "Altitude" DOUBLE PRECISION NOT NULL,
    "Course" DOUBLE PRECISION NOT NULL,
    "Satellites" INTEGER NOT NULL,
    "SpeedOTG" DOUBLE PRECISION NOT NULL,
    "AccelerationX1" DOUBLE PRECISION NOT NULL,
    "AccelerationY1" DOUBLE PRECISION NOT NULL,
    "Signal" INTEGER NOT NULL,
    "PowerSupply" INTEGER NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warning" (
    "id" SERIAL NOT NULL,
    "DeviceID" TEXT NOT NULL,
    "WarningTime" TIMESTAMP(3) NOT NULL,
    "WarningType" INTEGER NOT NULL,

    CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);
