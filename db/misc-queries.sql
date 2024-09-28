select * from images;

SELECT id, originalUrl, croppedUrl FROM images WHERE personId = 20;

select * from persons;

select * from shoots;

select * from users;

select * from preprocessed_images pi;

select * from lora_prompts lp;

  SELECT s.id, s.name, s.costume, COUNT(pi.id) as imageCount
  FROM shoots s
  JOIN preprocessed_images pi ON s.id = pi.shootId
  GROUP BY s.id
  HAVING imageCount > 0;
  
 SELECT * FROM loras;
 
SELECT gi.fullUrl, p.id, p.userId 
FROM persons p
JOIN loras l ON p.id = l.personId
JOIN generated_images gi on gi.loraId = l.id;

select * from p_backgrounds pb ;

SELECT * FROM generated_images gi; 

select * from users;

  SELECT gi.id, gi.fullUrl, gi.seed
  FROM generated_images gi
  JOIN loras l ON gi.loraId = l.id
  JOIN persons p ON l.personId = p.id
  WHERE p.userId = 2
  ORDER BY gi.created_at DESC;
  
  

       SELECT gi.id, gi.fullUrl, gi.seed, gp.userInput, gp.fullPrompt
      FROM persons p
      JOIN loras l ON p.id = l.personId
      JOIN generated_images gi ON gi.loraId = l.id
      LEFT JOIN generation_prompts gp ON gi.generatedPromptId = gp.id
      WHERE p.userId = ?
      ORDER BY gi.created_at DESC
 
  SELECT gi.id, gi.fullUrl, gi.seed
  FROM persons p
  JOIN loras l ON p.id = l.personId
  JOIN generated_images gi ON gi.loraId = l.id
 LEFT JOIN generation_prompts gp ON gi.generatedPromptId = gp.id
  WHERE p.userId = 1
  ORDER BY gi.created_at ASC;