-- Revert the otp_code column back to char(6)
alter table public.delivery_otps alter column otp_code type char(6);
