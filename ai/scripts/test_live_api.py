import json
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

payloads = [
    {
        'desc': 'Tiết BĐ: 7, Số lượng tiết: 3',
        'data': {
            'message_text': 'Thông báo học bù môn Lập trình Web: Tiết BĐ: 7, Số tiết: 3 tại phòng 501-A2',
            'subject_name': 'Lập trình Web',
            'current_datetime': '2026-10-26T14:00:00+07:00',
            'student_name': 'Nguyễn Việt Doanh'
        }
    },
    {
        'desc': '2 ca học - Student: Trần Văn Nam (N -> Ca 2)',
        'data': {
            'message_text': 'Lịch học bù thực hành: chia làm 2 ca, ca 1 tiết 1-3, ca 2 tiết 4-6 tại 401-A1',
            'subject_name': 'Lập trình Web',
            'current_datetime': '2026-10-26T14:00:00+07:00',
            'student_name': 'Trần Văn Nam'
        }
    },
    {
        'desc': '2 ca học - Student: Võ Thị Ánh (A -> Ca 1)',
        'data': {
            'message_text': 'Lịch học bù thực hành: chia làm 2 ca, ca 1 tiết 1-3, ca 2 tiết 4-6 tại 401-A1',
            'subject_name': 'Lập trình Web',
            'current_datetime': '2026-10-26T14:00:00+07:00',
            'student_name': 'Võ Thị Ánh'
        }
    },
    {
        'desc': '2 ca học - Student: Lê Minh Tuấn (T -> Ca 2)',
        'data': {
            'message_text': 'Lịch học bù thực hành: chia làm 2 ca, ca 1 tiết 1-3, ca 2 tiết 4-6 tại 401-A1',
            'subject_name': 'Lập trình Web',
            'current_datetime': '2026-10-26T14:00:00+07:00',
            'student_name': 'Lê Minh Tuấn'
        }
    },
    {
        'desc': '2 ca học - Student: Phạm Đạt (Đ -> Ca 1)',
        'data': {
            'message_text': 'Lịch học bù thực hành: chia làm 2 ca, ca 1 tiết 1-3, ca 2 tiết 4-6 tại 401-A1',
            'subject_name': 'Lập trình Web',
            'current_datetime': '2026-10-26T14:00:00+07:00',
            'student_name': 'Phạm Đạt'
        }
    }
]

headers = {'Content-Type': 'application/json', 'X-Internal-API-Key': 'development-secret-key'}

for p in payloads:
    req = urllib.request.Request(
        'http://localhost:8000/ai/analyze-message',
        data=json.dumps(p['data']).encode('utf-8'),
        headers=headers
    )
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        print(f"=== {p['desc']} ===")
        print(f"Events count: {len(res['detected_events'])}")
        for ev in res['detected_events']:
            print(f"Title: {ev['title']}")
            print(f"Time: {ev['start_datetime']} -> {ev['end_datetime']}")
            print(f"Note: {ev['note']}")
        print()
