select * from images;

select * from persons;

select * from shoots;

select * from preprocessed_images pi;


  SELECT s.id, s.name, s.costume, COUNT(pi.id) as imageCount
  FROM shoots s
  JOIN preprocessed_images pi ON s.id = pi.shootId
  GROUP BY s.id
  HAVING imageCount > 0;
  
 SELECT * FROM loras;
 
SELECT l.* FROM persons p
JOIN loras l ON p.id = l.personId;

SELECT * FROM generated_images gi 

