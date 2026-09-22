-- Migration: Add vehicle_number and package_image_url to orders table for Wholesale/Bulk transport tracking

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS vehicle_number text,
ADD COLUMN IF NOT EXISTS package_image_url text;
