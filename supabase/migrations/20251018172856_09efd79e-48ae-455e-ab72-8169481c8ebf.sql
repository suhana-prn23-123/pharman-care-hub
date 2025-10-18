-- Add policy for owners to view orders for their medicines
CREATE POLICY "Owners can view orders for their medicines"
ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM medicines
    JOIN owners ON medicines.owner_id = owners.owner_id
    WHERE medicines.id = orders.medicine_id
    AND owners.user_id = auth.uid()
  )
);