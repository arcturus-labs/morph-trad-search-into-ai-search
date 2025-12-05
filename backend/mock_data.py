"""
Mock property data for the real estate search demo.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random

def generate_mock_properties() -> List[Dict[str, Any]]:
    """Generate a diverse set of ~50 mock property listings."""
    
    property_types = ['house', 'condo', 'apartment', 'townhouse']
    neighborhoods = ['Mission District', 'SOMA', 'Pacific Heights', 'Noe Valley', 'Haight-Ashbury', 'Castro', 'Marina', 'Russian Hill']
    cities = ['San Francisco', 'Oakland', 'Berkeley']
    
    # List of available house images (house1.png through house9.png)
    # Images cycle through the list, starting over when we reach the end
    available_images = [
        "/images/house1.png",
        "/images/house2.png",
        "/images/house3.png",
        "/images/house4.png",
        "/images/house5.png",
        "/images/house6.png",
        "/images/house7.png",
        "/images/house8.png",
        "/images/house9.png"
    ]
    

    description_templates = [
                "Elegant {keyword} showcasing designer touches throughout. Gourmet kitchen with stainless steel appliances and custom cabinetry. Master suite with walk-in closet and ensuite bathroom. Located in prestigious neighborhood with tree-lined streets.",
        "Renovated {keyword} with thoughtful updates and character preserved. New roof and HVAC system installed last year. Freshly painted interior with neutral tones. Move-in ready condition with all major systems updated.",
        "Spacious {keyword} featuring multiple levels of living space. Formal dining room perfect for dinner parties and family room ideal for casual gatherings. Finished basement provides additional recreation space. Ideal for large families or entertaining.",
        "Bright and airy {keyword} with floor-to-ceiling windows throughout. Updated bathrooms feature modern vanities and tile work. Fresh paint in contemporary colors. Great natural light in every room creates cheerful atmosphere.",
        "Historic {keyword} with architectural character and modern conveniences. Original crown molding and built-in cabinetry preserved. Updated kitchen and bathrooms blend seamlessly with period details. Walking distance to historic downtown district.",
        "Contemporary {keyword} in prime location with stunning city views. Sleek design with high-end finishes throughout. Floor-to-ceiling windows showcase urban skyline. Perfect for urban professionals seeking modern lifestyle.",
        "Move-in ready {keyword} with neutral decor throughout. Freshly painted walls in warm beige tones. Professionally cleaned carpets and hardwood floors polished. All appliances included and in working order. Ready for immediate occupancy.",
        "Well-appointed {keyword} with attention to detail evident throughout. Custom built-ins in living room and office nook. Designer lighting fixtures add elegance. Quality craftsmanship visible in trim work and finishes.",
        "Inviting {keyword} with warm ambiance and comfortable living spaces. Cozy fireplace in family room perfect for winter evenings. Open kitchen layout encourages conversation. Perfect blend of style and functionality for daily living.",
        "Sophisticated {keyword} featuring high ceilings and architectural details throughout. Formal living room with bay window and separate dining room with wainscoting. Elegant finishes include crystal chandeliers and marble accents.",
        "Updated {keyword} with modern amenities while maintaining original charm. New electrical panel and updated plumbing fixtures. Energy efficient windows reduce utility costs. Original hardwood floors refinished to like-new condition.",
        "Charming {keyword} with character and exceptional curb appeal. Mature landscaping includes flowering shrubs and established trees. Well-maintained exterior with fresh paint. Great street presence draws admiring glances from passersby.",
        "Stylish {keyword} with contemporary design elements throughout. Open concept living area flows seamlessly to outdoor deck. Sliding glass doors connect indoor and outdoor entertaining spaces. Modern aesthetic appeals to design-conscious buyers.",
        "Comfortable {keyword} in established neighborhood with strong community feel. Quiet street with minimal traffic. Friendly neighbors organize block parties and holiday gatherings. Great sense of community makes this feel like home.",
        "Well-maintained {keyword} with pride of ownership evident everywhere. Recent improvements include updated HVAC system and fresh exterior paint. Landscaping professionally maintained. Low maintenance yard perfect for busy lifestyles.",
        "Desirable {keyword} in sought-after location with walkability score of 95. Close to award-winning restaurants, boutique shopping, and live entertainment venues. Walkable to many amenities including farmers market and community center.",
        "Impressive {keyword} with generous proportions throughout. Multiple living areas include formal living room, family room, and bonus room. Flexible floor plan accommodates various lifestyles from empty nesters to growing families.",
        "Renovated {keyword} with high-quality updates completed last year. New kitchen features quartz countertops and soft-close cabinetry. Updated bathrooms include walk-in showers and double vanities. Modern fixtures and finishes throughout.",
        "Charming {keyword} with period features and modern updates seamlessly integrated. Original hardwood floors refinished to showcase natural grain. Updated mechanical systems include tankless water heater. Historic character preserved.",
        "Spacious {keyword} perfect for entertaining large groups. Large kitchen with center island opens to family room creating great flow. Separate formal dining room accommodates dinner parties. Great flow for gatherings and holiday celebrations.",
        "Elegant {keyword} with sophisticated finishes throughout. Marble countertops in kitchen and master bathroom. Premium fixtures include designer faucets and lighting. Luxury touches include wine storage and butler's pantry.",
        "Bright {keyword} with excellent natural light from south-facing windows. Sunshine streams in all day creating warm atmosphere. Energy efficient design includes solar panels reducing electric bills. Skylights in kitchen add extra illumination.",
        "Updated {keyword} with contemporary style and open floor plan. Removed walls maximize space and create airy feel. Modern appliances include induction cooktop and built-in wine cooler. Sleek finishes appeal to modern sensibilities.",
        "Well-designed {keyword} with efficient use of every square foot. Smart storage solutions include built-in shelving and under-stair storage. Built-in organization systems in closets and pantry. Functional layout minimizes wasted space.",
        "Charming {keyword} with vintage character and unique architectural elements. Original details preserved include stained glass windows and decorative tile work. Unique architectural elements throughout make this one-of-a-kind property.",
        "Comfortable {keyword} in convenient location with easy access to major highways. Public transportation stops within two blocks. Commuter friendly location reduces daily travel time. Close to employment centers and business districts.",
        "Stylish {keyword} with designer touches throughout. Custom paint colors chosen by professional decorator. Modern fixtures include pendant lighting and contemporary hardware. Ready for your personal style with neutral foundation.",
        "Renovated {keyword} with quality improvements completed recently. New luxury vinyl plank flooring throughout main level. Updated kitchen includes new appliances and backsplash. Fresh and modern throughout with attention to detail.",
        "Spacious {keyword} with room to grow and flexible floor plan. Bonus room can serve as home office, playroom, or guest bedroom. Accommodates changing needs as family grows. Great for families planning for the future.",
        "Elegant {keyword} with formal spaces and casual living areas perfectly balanced. Formal living and dining rooms for special occasions. Casual family room and eat-in kitchen for daily life. Perfect balance of sophistication and comfort.",
        "Updated {keyword} with modern conveniences and improved energy efficiency. New double-pane windows reduce noise and energy costs. Updated doors include security features. Improved energy efficiency lowers monthly utility bills.",
        "Charming {keyword} with great potential and solid structure. Well-maintained foundation and roof provide excellent base. Opportunity for personalization allows buyer to add their own style. Great value for location and condition.",
        "Well-maintained {keyword} with recent updates and low maintenance requirements. New roof installed three years ago with transferable warranty. Updated systems include HVAC and water heater. Low maintenance yard with drought-resistant landscaping.",
        "Desirable {keyword} in prime location close to everything families need. Top-rated schools within walking distance. Community parks and playgrounds nearby. Family-friendly neighborhood with safe streets and sidewalks.",
        "Impressive {keyword} with high-end finishes and luxury living experience. Granite countertops and premium appliances throughout. Luxury living includes features like central vacuum and whole-house audio. Premium finishes justify the price point.",
        "Renovated {keyword} with thoughtful design and modern functionality. Open concept living creates sense of spaciousness. Modern and functional layout maximizes usability. Professional design choices create cohesive aesthetic.",
        "Charming {keyword} with character and style that sets it apart. Original features preserved include decorative fireplaces and built-in bookcases. Unique and special property with historic significance. Architectural details tell story of past eras.",
        "Spacious {keyword} perfect for large families with multiple children. Multiple bedrooms provide privacy for everyone. Multiple bathrooms eliminate morning rush. Room for everyone with space to spread out.",
        "Elegant {keyword} with sophisticated design perfect for entertaining. Formal entertaining spaces include separate living and dining rooms. Perfect for hosting dinner parties and holiday gatherings. Elegant finishes impress guests.",
        "Updated {keyword} with modern amenities and contemporary finishes. New kitchen includes stainless appliances and tile backsplash. Updated bathrooms feature modern vanities and fixtures. Contemporary finishes throughout appeal to modern buyers.",
        "Well-appointed {keyword} with quality construction and attention to detail. Solid foundation shows no signs of settling. Well-built structure has stood test of time. Built to last with materials that age gracefully.",
        "Bright {keyword} with excellent light from multiple exposures. Large windows throughout bring in natural light. Cheerful and welcoming atmosphere created by abundant sunshine. Light-filled rooms feel spacious and airy.",
        "Stylish {keyword} with contemporary flair and modern design elements. Fashionable and current design appeals to style-conscious buyers. Modern design elements include open shelving and statement lighting. Contemporary aesthetic stays relevant.",
        "Renovated {keyword} with high-quality updates and professional workmanship. Attention to detail evident in trim work and finishes. Professional workmanship ensures updates will last. Quality improvements add lasting value.",
        "Comfortable {keyword} in great location convenient to everything. Close to grocery stores, restaurants, and services. Easy living with everything you need nearby. Convenient location reduces daily errands and commutes.",
        "Charming {keyword} with vintage appeal and historic charm. Original character maintained through careful preservation. Historic charm attracts buyers seeking character. Period details tell story of property's history.",
        "Spacious {keyword} with flexible layout adaptable to various uses. Can be configured for home office, guest suite, or playroom. Versatile space accommodates changing needs. Flexible layout adds value and functionality.",
        "Elegant {keyword} with luxury features and premium materials throughout. Premium materials include hardwood floors and granite surfaces. High-end living includes features like wine cellar. Luxury features justify premium pricing.",
        "Updated {keyword} with energy-efficient improvements reducing utility costs. New insulation in walls and attic improves comfort. Energy efficient windows reduce heating and cooling costs. Lower utility costs benefit monthly budget.",
        "Well-maintained {keyword} with pride of ownership evident throughout. Clean and move-in ready condition. Well cared for property shows attention to detail. Pristine condition attracts discerning buyers.",
        "Desirable {keyword} in excellent location close to everything you need. Convenient living with amenities within walking distance. Close to everything reduces need for car trips. Excellent location adds to property value.",
        "Impressive {keyword} with grand proportions and impressive scale. High ceilings create sense of grandeur. Spacious rooms feel luxurious and comfortable. Impressive scale makes statement about quality of life.",
        "Renovated {keyword} with modern updates creating fresh and contemporary feel. Ready for modern living with updated systems and finishes. Fresh and contemporary aesthetic appeals to modern buyers. Modern updates ensure years of comfortable living.",
        "Charming {keyword} with unique features making it one-of-a-kind. Special and distinctive property stands out from others. Unique features include architectural details and custom elements. One-of-a-kind property attracts buyers seeking character.",
        "Spacious {keyword} perfect for entertaining with large gathering spaces. Large gathering spaces accommodate parties and events. Ideal for hosting family gatherings and social events. Entertaining spaces designed for comfort and flow.",
        "Elegant {keyword} with sophisticated style and designer finishes throughout. Luxury living experience includes premium amenities. Designer finishes add elegance and sophistication. Sophisticated style appeals to upscale buyers.",
        "Updated {keyword} with quality renovations and professional updates. Modern and functional improvements add value. Professional updates ensure quality and longevity. Quality renovations justify investment in property.",
        "Well-appointed {keyword} with thoughtful details and custom features. Personalized touches include built-in storage and custom millwork. Custom features add functionality and style. Thoughtful details show attention to quality.",
        "Bright {keyword} with natural light creating sunny and cheerful atmosphere. Positive energy throughout from abundant sunshine. Sunny exposure benefits mood and reduces need for artificial lighting. Natural light creates welcoming environment.",
        "Stylish {keyword} with modern design and contemporary style throughout. Fashion-forward living appeals to style-conscious buyers. Contemporary style stays current and relevant. Modern design creates sophisticated aesthetic.",
        "Renovated {keyword} with comprehensive updates creating turn-key condition. Everything new from appliances to systems. Turn-key condition means no immediate updates needed. Comprehensive updates ensure years of trouble-free living.",
        "Comfortable {keyword} in peaceful setting with quiet and serene atmosphere. Relaxing atmosphere provides escape from busy world. Quiet setting promotes rest and rejuvenation. Peaceful environment benefits mental health and wellbeing.",
        "Charming {keyword} with character and original details preserved. Historic appeal attracts buyers seeking authenticity. Original details include architectural elements and period features. Character preserved through careful maintenance.",
        "Spacious {keyword} with room for everyone and large family spaces. Accommodating layout works for families of all sizes. Large family spaces allow everyone to spread out. Room for everyone reduces conflicts over space.",
        "Elegant {keyword} with formal elegance and sophisticated spaces. Refined living includes formal entertaining areas. Sophisticated spaces impress guests and provide luxury experience. Formal elegance appeals to buyers seeking upscale lifestyle.",
        "Updated {keyword} with modern improvements and contemporary updates. New systems and finishes ensure reliability. Contemporary updates keep property current. Modern improvements add value and functionality.",
        "Well-maintained {keyword} in excellent condition with pristine upkeep. Move-in ready condition requires no immediate work. Well cared for property shows pride of ownership. Pristine condition attracts buyers seeking quality.",
        "Desirable {keyword} in prime area with best location in neighborhood. Highly sought after location commands premium pricing. Best location provides access to amenities and services. Prime area ensures strong resale value.",
        "Impressive {keyword} with striking features and architectural interest. Standout property attracts attention and admiration. Architectural interest includes unique design elements. Striking features make memorable first impression.",
        "Renovated {keyword} with tasteful updates and quality improvements. Enhanced value through thoughtful renovations. Quality improvements add lasting value. Tasteful updates preserve character while adding modern conveniences.",
        "Charming {keyword} with warm character creating inviting and cozy atmosphere. Welcoming feel makes visitors feel at home. Inviting atmosphere promotes relaxation and comfort. Warm character appeals to buyers seeking homey feel.",
        "Spacious {keyword} with generous rooms and large living areas. Room to breathe reduces feeling of confinement. Large living areas accommodate furniture and activities. Generous rooms provide comfort and flexibility.",
        "Elegant {keyword} with luxury amenities and premium features. High-end living includes premium amenities and services. Premium features justify luxury pricing. Luxury amenities provide enhanced quality of life.",
        "Updated {keyword} with smart improvements and energy efficient technology. Modern technology includes smart home features. Energy efficient design reduces environmental impact. Smart improvements add convenience and value.",
        "Well-appointed {keyword} with quality finishes and fine materials. Superior construction ensures durability and longevity. Fine materials age gracefully and maintain value. Quality finishes add elegance and sophistication.",
        "Bright {keyword} with abundant light and sunny exposure. Light-filled rooms feel spacious and welcoming. Sunny exposure provides natural warmth and reduces heating costs. Abundant light creates cheerful and positive atmosphere.",
        "Stylish {keyword} with designer appeal and fashionable design. Trend-setting style attracts fashion-conscious buyers. Fashionable design stays current and relevant. Designer appeal adds sophistication and elegance.",
        "Renovated {keyword} with complete transformation creating like-new condition. Fully updated property requires no immediate work. Like new condition provides peace of mind. Complete transformation ensures years of comfortable living.",
        "Comfortable {keyword} in ideal location with perfect setting. Ideal circumstances include access to amenities and services. Perfect setting provides quality of life benefits. Ideal location ensures strong resale value.",
        "Charming {keyword} with delightful features and charming details. Endearing character attracts buyers seeking personality. Charming details include architectural elements and custom touches. Delightful features create memorable experience.",
        "Spacious {keyword} with expansive layout and generous proportions. Ample space accommodates furniture and activities. Generous proportions create sense of luxury. Expansive layout provides flexibility and comfort.",
        "Elegant {keyword} with refined style and sophisticated design. Elegant living includes formal and casual spaces. Sophisticated design appeals to upscale buyers. Refined style adds timeless elegance and sophistication.",
        "Updated {keyword} with contemporary updates and modern conveniences. Current features include latest technology and finishes. Modern conveniences add comfort and functionality. Contemporary updates keep property current and relevant.",
        "Well-maintained {keyword} with excellent care and pristine condition. Well preserved property shows attention to maintenance. Excellent care ensures longevity and value. Pristine condition attracts discerning buyers.",
        "Desirable {keyword} in best location with prime position. Excellent placement provides access to amenities. Prime position ensures strong investment value. Best location commands premium pricing and quick sales.",
        "Impressive {keyword} with notable features and distinguished property. Exceptional home stands out from competition. Distinguished property attracts buyers seeking quality. Notable features include architectural and design elements.",
        "Renovated {keyword} with quality work and professional renovation. Expert craftsmanship ensures quality and durability. Professional renovation adds lasting value. Quality work justifies investment and provides peace of mind.",
        "Charming {keyword} with appealing character and attractive features. Desirable property attracts multiple offers. Attractive features include architectural details and design elements. Appealing character creates emotional connection with buyers.",
        "Spacious {keyword} with roomy interior and large floor plan. Generous dimensions accommodate furniture and activities. Large floor plan provides flexibility and comfort. Roomy interior creates sense of luxury and space.",
        "Elegant {keyword} with upscale features and luxury details. Premium property justifies higher pricing. Luxury details include premium materials and finishes. Upscale features provide enhanced quality of life.",
        "Updated {keyword} with modern touches and contemporary style. Current design appeals to modern buyers. Contemporary style stays relevant and fashionable. Modern touches add convenience and functionality.",
        "Well-appointed {keyword} with fine details and quality appointments. Superior features include custom elements and premium finishes. Quality appointments add elegance and sophistication. Fine details show attention to craftsmanship.",
        "Bright {keyword} with excellent illumination and well-lit spaces. Sunny disposition creates cheerful atmosphere. Well-lit spaces reduce need for artificial lighting. Excellent illumination benefits mood and energy levels.",
        "Stylish {keyword} with modern appeal and contemporary flair. Current style attracts fashion-conscious buyers. Contemporary flair adds sophistication and elegance. Modern appeal ensures property stays relevant.",
        "Renovated {keyword} with fresh updates and new improvements. Modernized features include latest technology and finishes. New improvements add value and functionality. Fresh updates create like-new condition.",
        "Comfortable {keyword} in great setting with ideal environment. Perfect location provides access to amenities and services. Ideal environment promotes quality of life. Great setting ensures strong resale value.",
        "Charming {keyword} with wonderful character and delightful details. Charming appeal creates emotional connection. Delightful details include architectural and design elements. Wonderful character attracts buyers seeking personality.",
        "Spacious {keyword} with ample room and large spaces. Generous area accommodates furniture and activities. Large spaces provide flexibility and comfort. Ample room creates sense of luxury and freedom.",
        "Elegant {keyword} with sophisticated features and refined details. Elegant style adds timeless appeal. Refined details include premium materials and finishes. Sophisticated features provide enhanced quality of life.",
        "Updated {keyword} with new improvements and recent updates. Modern enhancements add value and functionality. Recent updates ensure reliability and efficiency. New improvements provide peace of mind.",
        "Well-maintained {keyword} with great care and excellent upkeep. Well preserved property shows pride of ownership. Excellent upkeep ensures longevity and value. Great care attracts discerning buyers seeking quality.",
        "Desirable {keyword} in excellent area with prime location. Best position provides access to amenities and services. Prime location ensures strong investment value. Excellent area commands premium pricing.",
        "Impressive {keyword} with striking design and notable features. Standout home attracts attention and admiration. Notable features include architectural and design elements. Striking design creates memorable first impression.",
        "Renovated {keyword} with quality updates and professional work. Expert renovation adds lasting value and functionality. Professional work ensures quality and durability. Quality updates justify investment and provide peace of mind.",
        "Charming {keyword} with lovely character and appealing features. Charming style creates emotional connection. Appealing features include architectural details and design elements. Lovely character attracts buyers seeking personality.",
        "Spacious {keyword} with generous space and large rooms. Room for all accommodates families and activities. Large rooms provide flexibility and comfort. Generous space creates sense of luxury and freedom.",
        "Elegant {keyword} with luxury features and premium details. High-end property justifies premium pricing. Premium details include luxury materials and finishes. Luxury features provide enhanced quality of life.",
        "Updated {keyword} with modern updates and contemporary improvements. Current features include latest technology and finishes. Contemporary improvements add value and functionality. Modern updates keep property current and relevant.",
        "Well-appointed {keyword} with fine finishes and quality materials. Superior construction ensures durability and longevity. Quality materials age gracefully and maintain value. Fine finishes add elegance and sophistication.",
        "Bright {keyword} with natural illumination and sunny spaces. Light-filled rooms feel spacious and welcoming. Sunny spaces provide natural warmth and reduce heating costs. Natural illumination creates cheerful and positive atmosphere.",
        "Stylish {keyword} with designer style and fashionable design. Trendy appeal attracts fashion-conscious buyers. Fashionable design stays current and relevant. Designer style adds sophistication and elegance.",
        "Renovated {keyword} with complete updates and full renovation. Like new condition provides peace of mind. Fully renovated property requires no immediate work. Complete updates ensure years of comfortable living.",
        "Comfortable {keyword} in perfect location with ideal setting. Best circumstances include access to amenities and services. Ideal setting provides quality of life benefits. Perfect location ensures strong resale value.",
        "Charming {keyword} with delightful character and wonderful features. Charming appeal creates emotional connection with buyers. Wonderful features include architectural and design elements. Delightful character attracts buyers seeking personality.",
        "Spacious {keyword} with expansive space and large floor plan. Generous layout provides flexibility and comfort. Large floor plan accommodates furniture and activities. Expansive space creates sense of luxury and freedom.",
        "Elegant {keyword} with refined features and sophisticated details. Elegant style adds timeless appeal and sophistication. Sophisticated details include premium materials and finishes. Refined features provide enhanced quality of life.",
        "Updated {keyword} with contemporary updates and modern improvements. Current features include latest technology and finishes. Modern improvements add value and functionality. Contemporary updates keep property current and relevant.",
        "Well-maintained {keyword} with excellent condition and pristine upkeep. Well cared for property shows pride of ownership. Pristine upkeep ensures longevity and value. Excellent condition attracts discerning buyers seeking quality.",
    ]
    
    keywords = ['family home', 'home', 'property', 'residence', 'house', 'dwelling']
    
    properties = []
    
    # Generate properties with varied characteristics
    for i in range(500):
        property_type = random.choice(property_types)
        bedrooms = random.choice([0, 1, 2, 3, 4, 5])
        if bedrooms == 0:
            bedrooms_display = "Studio"
        else:
            bedrooms_display = f"{bedrooms} BR"
        
        # Price ranges based on property type and bedrooms
        if property_type == 'apartment':
            base_price = random.randint(300000, 600000)
        elif property_type == 'condo':
            base_price = random.randint(500000, 900000)
        elif property_type == 'townhouse':
            base_price = random.randint(600000, 1000000)
        else:  # house
            base_price = random.randint(700000, 1500000)
        
        # Adjust price based on bedrooms
        if bedrooms >= 4:
            base_price = int(base_price * 1.2)
        elif bedrooms <= 1:
            base_price = int(base_price * 0.8)
        
        # Square footage based on bedrooms
        if bedrooms == 0:
            square_feet = random.randint(400, 700)
        elif bedrooms == 1:
            square_feet = random.randint(600, 900)
        elif bedrooms == 2:
            square_feet = random.randint(900, 1400)
        elif bedrooms == 3:
            square_feet = random.randint(1400, 2000)
        elif bedrooms == 4:
            square_feet = random.randint(2000, 2800)
        else:  # 5+
            square_feet = random.randint(2800, 4000)
        
        # Generate listing date (some recent, some older)
        days_ago = random.randint(0, 60)
        listing_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        # Generate title
        if property_type == 'house':
            title_prefixes = ['Charming Victorian', 'Spacious', 'Classic', 'Modern', 'Stunning', 'Beautiful']
        elif property_type == 'condo':
            title_prefixes = ['Modern Downtown', 'Luxury', 'Stylish', 'Contemporary']
        elif property_type == 'apartment':
            title_prefixes = ['Cozy', 'Bright', 'Updated', 'Spacious']
        else:  # townhouse
            title_prefixes = ['Move-In Ready', 'Beautiful', 'Modern']
        
        title_prefix = random.choice(title_prefixes)
        
        if bedrooms >= 3:
            title_suffix = f"Family Home"
        elif bedrooms == 0:
            title_suffix = "Studio Apartment"
        else:
            title_suffix = f"{bedrooms} Bedroom {property_type.capitalize()}"
        
        if random.random() > 0.5:
            title = f"{title_prefix} {title_suffix}"
        else:
            location_suffix = random.choice(['with Bay Views', 'in Mission District', 'Near Parks', 'Downtown'])
            title = f"{title_prefix} {title_suffix} {location_suffix}"
        
        # Generate description
        keyword = random.choice(keywords)
        template = random.choice(description_templates)
        description = template.format(keyword=keyword, bedrooms=bedrooms)
        description += f" This {property_type} features {square_feet} square feet of living space."
        
        # Add more detail
        if random.random() > 0.5:
            description += " Close to public transit and shopping centers."
        if random.random() > 0.5:
            description += " HOA includes water and trash."
        if random.random() > 0.5:
            description += " Great investment opportunity."
        
        property_data = {
            "id": f"prop-{str(i+1).zfill(3)}",
            "title": title,
            "description": description,
            "price": base_price,
            "bedrooms": bedrooms,
            "square_feet": square_feet,
            "property_type": property_type,
            "listing_date": listing_date,
            "images": [available_images[i % len(available_images)]],  # Cycle through house1-house9, wrapping around
            "neighborhood": random.choice(neighborhoods),
            "city": random.choice(cities)
        }
        
        properties.append(property_data)
    
    # Add some specific properties that match common searches
    properties.append({
        "id": "prop-special-001",
        "title": "Charming Victorian Family Home with Bay Views",
        "description": "Perfect family home in quiet neighborhood. Recently updated kitchen, large backyard ideal for children. Walking distance to top-rated schools and parks. This beautiful Victorian features original hardwood floors, high ceilings, and period details throughout.",
        "price": 750000,
        "bedrooms": 3,
        "square_feet": 1850,
        "property_type": "house",
        "listing_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        "images": [available_images[0]],  # house1.png
        "neighborhood": "Mission District",
        "city": "San Francisco"
    })
    
    properties.append({
        "id": "prop-special-002",
        "title": "Spacious Home in Mission District",
        "description": "Wonderful family-friendly home with 4 bedrooms and 2.5 baths. Large living spaces perfect for entertaining. Updated kitchen with granite countertops. Close to public transit and shopping centers.",
        "price": 695000,
        "bedrooms": 4,
        "square_feet": 2200,
        "property_type": "house",
        "listing_date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
        "images": [available_images[1]],  # house2.png
        "neighborhood": "Mission District",
        "city": "San Francisco"
    })
    
    properties.append({
        "id": "prop-special-003",
        "title": "Move-In Ready Townhouse",
        "description": "Beautiful townhouse perfect for growing families. Three bedrooms, 2.5 baths, and a private patio. Modern finishes throughout. Great location near schools, parks, and shopping centers.",
        "price": 599000,
        "bedrooms": 3,
        "square_feet": 1600,
        "property_type": "townhouse",
        "listing_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "images": [available_images[2]],  # house3.png
        "neighborhood": "Noe Valley",
        "city": "San Francisco"
    })
    
    return properties

# Pre-generate the mock properties
MOCK_PROPERTIES = generate_mock_properties()

