# BEYOND | NASA Space Apps

تجربة ويب تفاعلية لاستكشاف صحة رواد الفضاء والظروف التي تؤثر على حياتهم خارج الأرض. تشمل رحلة إلى القمر، ونموذجاً تشريحياً ثلاثي الأبعاد، وسجلات صحية تعليمية تحاكي بيانات الطاقم.

## المتطلبات

- Node.js ‏20.9 أو أحدث مع npm.
- Git لتنزيل المشروع بالأوامر، أو ملف ZIP من GitHub.
- متصفح يدعم WebGL للمشاهد ثلاثية الأبعاد.

## تنزيل المشروع وتثبيته

```bash
git clone https://github.com/RlxChap2/NasaSpaceApps.git
cd NasaSpaceApps
npm ci
```

يمكنك أيضاً تنزيل **Code → Download ZIP** من صفحة المستودع، وفك الضغط، وفتح الطرفية داخل المجلد الناتج، ثم تشغيل `npm ci`.

## التشغيل محلياً

```bash
npm run dev
```

افتح [http://localhost:3847](http://localhost:3847). صفحة [صحة الطاقم](http://localhost:3847/crew-health) تعرض النموذج التشريحي والسجلات اليومية.

## بناء نسخة الإنتاج وتشغيلها

```bash
npm run build
npm start
```

تعمل نسخة الإنتاج أيضاً على المنفذ `3847`. لفحص الشيفرة شغّل `npm run lint`.

## مصادر الأصول

- [صور وفيديو NASA](public/images/NASA-MEDIA.md)
- [ترخيص النماذج التشريحية](public/models/anatomy/LICENSE.md)
- [مصادر نموذج الخوذة](public/models/helmet/ATTRIBUTION.md)
