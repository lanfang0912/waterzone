-- 每個頁面的 email_subject 和 email_body
-- 資源頁面有 [資源連結] 佔位符，請替換成實際 PDF / Google 試算表連結
-- 執行前請確認每個連結都填好

-- 1. nextstep：《回到下一步》行動指引
UPDATE landing_pages SET
  email_subject = $${name}，你的《回到下一步》行動指引在這裡$$,
  email_body = $$嗨 {name}，

謝謝你領取《回到下一步》行動指引。

這份指引不是什麼高深的理論，而是三個問句——當你卡在挫折裡、找不到下一步的時候，用這三個問句把自己拉回現實。

👉 [資源連結]

慢慢看，不用急。
有任何想說的，直接回信給我。

Erica 藍方$$
WHERE slug = 'nextstep';

-- 2. checklist：兩份關係檢核表（大人版 + 孩子版）
UPDATE landing_pages SET
  email_subject = $${name}，你的關係檢核表來了$$,
  email_body = $$嗨 {name}，

謝謝你拿了這份檢核表。

兩份都在下面——
大人版是看你們之間現在的狀態，
孩子版是看你和孩子的連結。

👉 [資源連結]

慢慢填，不用一次全做完。
有什麼問題，直接回信給我。

Erica 藍方$$
WHERE slug = 'checklist';

-- 3. parent-boundary：親子界線句型指南
UPDATE landing_pages SET
  email_subject = $${name}，你的親子界線句型指南到了$$,
  email_body = $$嗨 {name}，

謝謝你願意領取這份句型指南。

裡面有三個情境的句型範本，還有框架說明，以及快要妥協時可以對自己說的話。

👉 [資源連結]

孩子一哭就心軟，不是你不夠堅強。
是因為你從來沒有被這樣教過。
這份指南，就是給那個從來沒有人教過你的地方。

Erica 藍方$$
WHERE slug = 'parent-boundary';

-- 4. path：家庭支持系統三道裂痕
UPDATE landing_pages SET
  email_subject = $${name}，謝謝你願意停下來看這件事$$,
  email_body = $$嗨 {name}，

家裡有些東西，不是溝通技巧能解決的。
那是通道壞了——信任、表達、情緒的管道堵住了。

謝謝你願意停下來正視這件事。

👉 [資源連結]

如果你想聊更多，直接回信給我。

Erica 藍方$$
WHERE slug = 'path';

-- 5. system：7 個系統化檢查點
UPDATE landing_pages SET
  email_subject = $${name}，你的 7 個系統化檢查點寄到了$$,
  email_body = $$嗨 {name}，

謝謝你想讓自己做的事更系統化。

這 7 個檢查點，是用來幫你看清楚：
你現在做的，是一門生意，還是一套可以被複製的系統？

👉 [資源連結]

看完有什麼想法，直接回信給我。

Erica 藍方$$
WHERE slug = 'system';

-- 6. calendar：個人生活規劃行事曆模版
UPDATE landing_pages SET
  email_subject = $${name}，你的行事曆模版連結在這裡$$,
  email_body = $$嗨 {name}，

謝謝你領取行事曆模版！

點下面的連結，複製一份到你自己的帳號就可以開始用。

👉 [Google 試算表 / Notion 模版連結]

這份模版的設計邏輯，是把生活也排進去，不只是工作。
工作之外的事，也值得被認真對待。

Erica 藍方$$
WHERE slug = 'calendar';

-- 7. scan：家庭界線與信念掃描清單
UPDATE landing_pages SET
  email_subject = $${name}，你的家庭界線掃描清單來了$$,
  email_body = $$嗨 {name}，

謝謝你願意停下來掃描自己的狀態。

這份清單是用來幫你看清楚：
你和家人的連結，是出於愛，還是出於恐懼？

👉 [資源連結]

不管結果是什麼，你願意問這個問題，已經很不容易了。

Erica 藍方$$
WHERE slug = 'scan';

-- 8. border：邊界小抄
UPDATE landing_pages SET
  email_subject = $${name}，你的邊界小抄寄到了$$,
  email_body = $$嗨 {name}，

謝謝你領取這份邊界小抄。

一頁版，放在手機裡隨時可以看。
那些想說「算了」的瞬間，或許可以換個說法。

👉 [資源連結]

有任何問題，直接回信。

Erica 藍方$$
WHERE slug = 'border';

-- 9. catch：12 種情感忽視父母類型對照清單
UPDATE landing_pages SET
  email_subject = $${name}，你的 12 種情感忽視父母類型清單到了$$,
  email_body = $$嗨 {name}，

謝謝你願意看見這件事。

12 種類型，不是要你去評判誰對誰錯。
是幫你看見，那些沒有被接住的地方，從哪裡來的。

👉 [資源連結]

看完如果有很多感受，這很正常。
你可以直接回信告訴我。

Erica 藍方$$
WHERE slug = 'catch';

-- 10. dating：約會溺水對照表
UPDATE landing_pages SET
  email_subject = $${name}，你的約會對照表在這裡$$,
  email_body = $$嗨 {name}，

謝謝你領取這份對照表。

忽冷忽熱、一直猜、不敢說不——
這些不是你太敏感，是你的感受在告訴你一件重要的事。

👉 [資源連結]

看完有任何想說的，直接回信。

Erica 藍方$$
WHERE slug = 'dating';

-- 11. waterzone：主場水域自測（測驗）
UPDATE landing_pages SET
  email_subject = $${name}，謝謝你做完了主場水域自測$$,
  email_body = $$嗨 {name}，

謝謝你做完了測驗。

你的結果已經在頁面顯示了。
如果你想再看一次，可以回到這裡：
https://admin.urland.com.tw/waterzone

測驗告訴你的是現在的位置——但位置可以改變。
如果你想知道怎麼往前走，直接回信給我。

Erica 藍方$$
WHERE slug = 'waterzone';

-- 12. couples-stuck：親密關係卡點測驗（測驗）
UPDATE landing_pages SET
  email_subject = $${name}，謝謝你做完了親密關係卡點測驗$$,
  email_body = $$嗨 {name}，

謝謝你做完了測驗。

你的完整解讀已經在頁面顯示了。
如果你想再看一次，可以回到這裡：
https://admin.urland.com.tw/couples-stuck

那個卡住的地方，不是你的問題。
是你還沒有看見它——而你現在看見了。

如果你想深入了解你的卡點，直接回信給我。

Erica 藍方$$
WHERE slug = 'couples-stuck';

-- 13. familyquiz：家庭支持系統診斷（測驗）
UPDATE landing_pages SET
  email_subject = $${name}，你的家庭支持系統診斷結果$$,
  email_body = $$嗨 {name}，

謝謝你做完了家庭測驗。

你的結果已經在剛才的頁面顯示了。
如果你想再看一次，可以回到這裡：
https://admin.urland.com.tw/familyquiz

不管你是哪一型，這份診斷說的不是「你的家出了什麼問題」。
而是「現在這個狀態，你需要什麼支持」。

如果你想繼續聊，直接回信給我。

Erica 藍方$$
WHERE slug = 'familyquiz';
